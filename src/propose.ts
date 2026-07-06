import path from "node:path";
import { ensureDir, readText, writeText, writeYaml } from "./fs-utils.js";
import { findPacket, updatePacket } from "./input.js";
import { assertSafeId, projectRoot, relativeToProject } from "./paths.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";
import { AuthorInputPacket } from "./schemas.js";

export type ProposalKind = "character" | "setting" | "worldbuilding" | "outline" | "ambiguity";

export interface ProposalResult {
  ok: true;
  operation_id: string;
  input_id: string;
  kind: ProposalKind;
  changed_files: string[];
  next_commands: string[];
}

export async function createMemoryProposal(projectName: string, inputId: string, kind: string): Promise<ProposalResult> {
  assertSafeId(inputId, "inputId");
  const proposalKind = normalizeProposalKind(kind);
  const { packet } = await findPacket(projectName, inputId);
  if (!["triaged", "routed"].includes(packet.status)) {
    throw new Error(`Input ${inputId} is ${packet.status}; propose accepts triaged or routed inputs.`);
  }

  const root = projectRoot(projectName);
  const rawText = await readText(path.join(root, packet.raw_source_path));
  const intakeDir = path.join(root, "01_intake", inputId);
  await ensureDir(intakeDir);

  const memoryPatchPath = path.join(intakeDir, "memory_patch.yaml");
  const summaryPath = path.join(intakeDir, "proposal_summary.md");
  const memoryPatch = buildProposalPatch(packet, rawText, proposalKind);
  await writeYaml(memoryPatchPath, memoryPatch);
  await writeText(summaryPath, buildProposalSummary(packet, rawText, proposalKind));

  const nextPacket: AuthorInputPacket = {
    ...packet,
    status: "pending_confirmation",
    requires_confirmation: true,
    recommended_actions: ["review_proposal", "approve_or_reject_memory_patch"],
  };
  await updatePacket(projectName, nextPacket, "processed");

  const changedFiles = [
    relativeToProject(projectName, memoryPatchPath),
    relativeToProject(projectName, summaryPath),
    `00_inbox/processed/${inputId}.yaml`,
  ];
  const trace = await appendTrace(projectName, {
    command: "propose",
    input_id: inputId,
    from_status: packet.status,
    to_status: "pending_confirmation",
    artifacts: changedFiles,
    metadata: { kind: proposalKind },
  });

  return {
    ok: true,
    operation_id: trace.event_id,
    input_id: inputId,
    kind: proposalKind,
    changed_files: changedFiles,
    next_commands: [`novel review decide ${projectName} ${inputId} --decision approve`],
  };
}

function normalizeProposalKind(kind: string): ProposalKind {
  if (["character", "setting", "worldbuilding", "outline", "ambiguity"].includes(kind)) {
    return kind as ProposalKind;
  }
  throw new Error(`Invalid proposal kind ${kind}. Expected character, setting, worldbuilding, outline or ambiguity.`);
}

function buildProposalPatch(packet: AuthorInputPacket, rawText: string, kind: ProposalKind): unknown {
  const patchId = `patch_${packet.input_id}_${kind}_001`;
  const excerpt = rawText.trim().slice(0, 800);
  const lines = meaningfulLines(rawText);
  const firstClaim = lines.find((line) => !line.startsWith("#")) ?? (excerpt.slice(0, 160) || "待人工补录。");
  const characterId = packet.target_scope.entity ?? "protagonist";
  const updates: Record<string, unknown> = {
    timeline: {
      add_event: {
        chapter: packet.target_scope.chapter ?? `${kind}_proposal`,
        event: `${kind} proposal: ${compactText(firstClaim)}`,
      },
    },
    unresolved_hooks: {
      add: extractHooks(rawText, kind),
    },
    raw_evidence_excerpt: excerpt,
    proposal_kind: kind,
  };

  if (kind === "character") {
    updates.characters = {
      [characterId]: {
        candidates: lines.slice(0, 8).map((line) => compactText(line)),
      },
    };
  }

  if (kind === "worldbuilding" || kind === "setting") {
    updates.world_contract_candidates = lines.slice(0, 10).map((line) => compactText(line));
  }

  if (kind === "outline") {
    updates.outline_candidates = lines.slice(0, 12).map((line) => compactText(line));
  }

  if (kind === "ambiguity") {
    updates.ambiguity_guard = {
      excerpt,
      rule: "Do not auto-explain or promote this ambiguity to canon without author confirmation.",
    };
  }

  return {
    patch_id: patchId,
    requires_human_approval: true,
    created_at: nowIso(),
    source_input: packet.input_id,
    updates,
  };
}

function buildProposalSummary(packet: AuthorInputPacket, rawText: string, kind: ProposalKind): string {
  return `# Proposal Summary - ${packet.input_id}

kind: ${kind}
source_input: ${packet.input_id}
created_at: ${nowIso()}
status: proposal_only

## System Interpretation

${packet.system_interpretation.map((item) => `- ${item}`).join("\n")}

## Raw Evidence

> ${rawText.trim().slice(0, 600).replace(/\n/g, "\n> ")}

## Apply Guidance

- Review this proposal before approving.
- Use \`novel patch apply <project> ${packet.input_id} --target plot|character|canon|ambiguity|all\` after approval.
- This file is not canon.
`;
}

function meaningfulLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, 24);
}

function extractHooks(rawText: string, kind: ProposalKind): string[] {
  const hooks = meaningfulLines(rawText)
    .filter((line) => /伏笔|留白|秘密|真相|目标|风险|代价|卷|父亲|敌人|规则|不能|不要|必须/.test(line))
    .map((line) => `${kind} candidate: ${compactText(line)}`)
    .slice(0, 6);
  return hooks.length > 0 ? hooks : [`${kind} proposal needs author confirmation before canon.`];
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}
