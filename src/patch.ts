import path from "node:path";
import { appendText, pathExists, readText, readYaml, writeYaml } from "./fs-utils.js";
import { findPacket, updatePacket } from "./input.js";
import { assertSafeId, projectRoot, relativeToProject } from "./paths.js";
import { decideReview, readReviewDecision } from "./review.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";

export type PatchTarget = "all" | "canon" | "character" | "plot" | "style" | "ambiguity";

export interface PatchApplyResult {
  ok: true;
  operation_id: string;
  input_id: string;
  patch_id: string;
  target: PatchTarget;
  changed_files: string[];
  next_commands: string[];
}

export async function applyMemoryPatch(projectName: string, inputId: string, target: string): Promise<PatchApplyResult> {
  const normalizedTarget = normalizeTarget(target);
  const { packet } = await findPacket(projectName, inputId);
  if (packet.status === "applied") {
    throw new Error(`Input ${inputId} is already applied.`);
  }
  if (packet.status !== "pending_confirmation") {
    throw new Error(`Input ${inputId} is ${packet.status}; patch apply requires pending_confirmation.`);
  }

  const decision = await readReviewDecision(projectName, inputId);
  if (decision?.decision !== "approved") {
    throw new Error(`Input ${inputId} has not been approved. Run review decide --decision approve first.`);
  }

  const root = projectRoot(projectName);
  const memoryPatchPath = path.join(root, "01_intake", inputId, "memory_patch.yaml");
  if (!(await pathExists(memoryPatchPath))) {
    throw new Error(`Memory patch not found for ${inputId}: 01_intake/${inputId}/memory_patch.yaml`);
  }

  const memoryPatch = await readYaml<Record<string, unknown>>(memoryPatchPath);
  if (memoryPatch.requires_human_approval !== true) {
    throw new Error(`Memory patch ${inputId} must declare requires_human_approval: true.`);
  }

  const patchId = asString(memoryPatch.patch_id) ?? `patch_${inputId}`;
  const changed = await applyPatchTarget(projectName, inputId, patchId, memoryPatch, normalizedTarget);
  const appliedPath = path.join(root, "01_intake", inputId, "memory_patch_applied.yaml");
  await writeYaml(appliedPath, {
    patch_id: patchId,
    input_id: inputId,
    target: normalizedTarget,
    applied_at: nowIso(),
    changed_files: changed,
  });
  changed.push(relativeToProject(projectName, appliedPath));

  await updatePacket(projectName, {
    ...packet,
    status: "applied",
    requires_confirmation: false,
    recommended_actions: ["build_context_packet"],
  });
  changed.push(`00_inbox/processed/${inputId}.yaml`);

  const trace = await appendTrace(projectName, {
    command: "patch.apply",
    input_id: inputId,
    from_status: packet.status,
    to_status: "applied",
    artifacts: changed,
    metadata: { patch_id: patchId, target: normalizedTarget },
  });

  return {
    ok: true,
    operation_id: trace.event_id,
    input_id: inputId,
    patch_id: patchId,
    target: normalizedTarget,
    changed_files: changed,
    next_commands: packet.target_scope.chapter ? [`novel context build ${projectName} --chapter ${packet.target_scope.chapter}`] : [],
  };
}

export async function rejectMemoryPatch(projectName: string, inputId: string, reason: string | null): Promise<Awaited<ReturnType<typeof decideReview>>> {
  return decideReview(projectName, inputId, "reject", reason);
}

function normalizeTarget(target: string): PatchTarget {
  if (["all", "canon", "character", "plot", "style", "ambiguity"].includes(target)) {
    return target as PatchTarget;
  }
  throw new Error(`Invalid patch target ${target}. Expected all, canon, character, plot, style or ambiguity.`);
}

async function applyPatchTarget(
  projectName: string,
  inputId: string,
  patchId: string,
  memoryPatch: Record<string, unknown>,
  target: PatchTarget,
): Promise<string[]> {
  const changed = new Set<string>();
  const targets: PatchTarget[] = target === "all" ? ["plot", "character", "canon", "style", "ambiguity"] : [target];
  for (const item of targets) {
    if (item === "plot") {
      for (const file of await applyPlotPatch(projectName, inputId, patchId, memoryPatch)) changed.add(file);
    } else if (item === "character") {
      for (const file of await applyCharacterPatch(projectName, patchId, memoryPatch)) changed.add(file);
    } else if (item === "canon") {
      changed.add(await applyCanonPatch(projectName, inputId, patchId, memoryPatch));
    } else if (item === "style") {
      const file = await applyStylePatch(projectName, inputId, patchId);
      if (file) changed.add(file);
    } else if (item === "ambiguity") {
      changed.add(await applyAmbiguityPatch(projectName, inputId, patchId, memoryPatch));
    }
  }
  return [...changed];
}

async function applyPlotPatch(projectName: string, inputId: string, patchId: string, memoryPatch: Record<string, unknown>): Promise<string[]> {
  const root = projectRoot(projectName);
  const updates = asRecord(memoryPatch.updates);
  const timeline = asRecord(updates?.timeline);
  const addEvent = asRecord(timeline?.add_event);
  const event = asString(addEvent?.event);
  const chapter = asString(addEvent?.chapter) ?? "unknown_chapter";
  const changed: string[] = [];

  if (event) {
    const timelinePath = path.join(root, "30_plot/timeline.jsonl");
    await appendText(timelinePath, JSON.stringify({
      chapter,
      event,
      source_patch: patchId,
      source_input: inputId,
      applied_at: nowIso(),
    }));
    changed.push(relativeToProject(projectName, timelinePath));
  }

  const hooks = asStringArray(asRecord(updates?.unresolved_hooks)?.add);
  if (hooks.length > 0) {
    const hooksPath = path.join(root, "30_plot/unresolved_hooks.md");
    await appendText(hooksPath, `
## Applied from ${patchId}

source_input: ${inputId}
applied_at: ${nowIso()}

${hooks.map((hook) => `- ${hook}`).join("\n")}
`);
    changed.push(relativeToProject(projectName, hooksPath));
  }

  return changed;
}

async function applyCharacterPatch(projectName: string, patchId: string, memoryPatch: Record<string, unknown>): Promise<string[]> {
  const root = projectRoot(projectName);
  const characters = asRecord(asRecord(memoryPatch.updates)?.characters);
  if (!characters) return [];

  const changed: string[] = [];
  for (const [entity, value] of Object.entries(characters)) {
    assertSafeId(entity, "character id");
    const candidates = asStringArray(asRecord(value)?.candidates);
    if (candidates.length === 0) continue;
    const characterPath = path.join(root, "20_entities/characters", `${entity}.yaml`);
    const character = (await pathExists(characterPath)) ? await readYaml<Record<string, unknown>>(characterPath) : { id: entity, display_name: entity };
    const existing = asStringArray(character.candidate_traits);
    character.candidate_traits = [...existing, ...candidates.map((candidate) => `${candidate} (source: ${patchId})`)];
    await writeYaml(characterPath, character);
    changed.push(relativeToProject(projectName, characterPath));
  }
  return changed;
}

async function applyCanonPatch(projectName: string, inputId: string, patchId: string, memoryPatch: Record<string, unknown>): Promise<string> {
  const root = projectRoot(projectName);
  const canonPath = path.join(root, "10_bible/canon_registry.md");
  const updates = asRecord(memoryPatch.updates);
  const event = asString(asRecord(asRecord(updates?.timeline)?.add_event)?.event) ?? "No concrete event extracted.";
  const hooks = asStringArray(asRecord(updates?.unresolved_hooks)?.add);
  await appendText(canonPath, `
## Applied Patch ${patchId}

source_input: ${inputId}
applied_at: ${nowIso()}

- event: ${event}
${hooks.map((hook) => `- unresolved_hook: ${hook}`).join("\n")}
`);
  return relativeToProject(projectName, canonPath);
}

async function applyStylePatch(projectName: string, inputId: string, patchId: string): Promise<string | null> {
  const root = projectRoot(projectName);
  const source = path.join(root, "01_intake", inputId, "style_candidates.md");
  if (!(await pathExists(source))) return null;
  const stylePath = path.join(root, "40_style/style_bible.md");
  const text = await readText(source);
  await appendText(stylePath, `
## Confirmed Style from ${patchId}

source_input: ${inputId}
applied_at: ${nowIso()}

${text.trim()}
`);
  return relativeToProject(projectName, stylePath);
}

async function applyAmbiguityPatch(projectName: string, inputId: string, patchId: string, memoryPatch: Record<string, unknown>): Promise<string> {
  const root = projectRoot(projectName);
  const ambiguityPath = path.join(root, "10_bible/intentional_ambiguity.md");
  const excerpt = asString(asRecord(memoryPatch.updates)?.raw_evidence_excerpt) ?? "No excerpt recorded.";
  await appendText(ambiguityPath, `
## Applied Ambiguity Guard ${patchId}

source_input: ${inputId}
applied_at: ${nowIso()}

${excerpt}
`);
  return relativeToProject(projectName, ambiguityPath);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
