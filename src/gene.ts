import path from "node:path";
import { ensureDir, pathExists, readYaml, writeYaml } from "./fs-utils.js";
import { assertSafeId, projectRoot } from "./paths.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";
import { defaultPromiseLedger, defaultStoryEngine } from "./project.js";
import { GeneFieldStatus, GeneFieldStatusSchema, PromiseLedgerSchema, StoryEngineSchema } from "./schemas.js";

export interface GeneMigrationResult {
  ok: true;
  changed_files: string[];
  existing_files: string[];
}

export async function migrateWebnovelGene(projectName: string): Promise<GeneMigrationResult> {
  const root = projectRoot(projectName);
  const changed: string[] = [];
  const existing: string[] = [];

  for (const dir of ["35_storycraft/gene", "35_storycraft/serial_plan"]) {
    const full = path.join(root, dir);
    if (await pathExists(full)) {
      existing.push(dir);
    } else {
      await ensureDir(full);
      changed.push(dir);
    }
  }

  const storyEnginePath = path.join(root, "10_bible/story_engine.yaml");
  if (await pathExists(storyEnginePath)) {
    existing.push("10_bible/story_engine.yaml");
  } else {
    await writeYaml(storyEnginePath, defaultStoryEngine());
    changed.push("10_bible/story_engine.yaml");
  }

  const promiseLedgerPath = path.join(root, "30_plot/promise_ledger.yaml");
  if (await pathExists(promiseLedgerPath)) {
    existing.push("30_plot/promise_ledger.yaml");
  } else {
    await writeYaml(promiseLedgerPath, defaultPromiseLedger());
    changed.push("30_plot/promise_ledger.yaml");
  }

  await appendTrace(projectName, {
    command: "migrate.webnovel-gene",
    artifacts: changed,
    metadata: { existing_files: existing },
  });

  return { ok: true, changed_files: changed, existing_files: existing };
}

export async function showGeneLayer(projectName: string): Promise<{ ok: true; story_engine: unknown; promise_ledger: unknown }> {
  const root = projectRoot(projectName);
  const storyEnginePath = path.join(root, "10_bible/story_engine.yaml");
  const promiseLedgerPath = path.join(root, "30_plot/promise_ledger.yaml");
  return {
    ok: true,
    story_engine: (await pathExists(storyEnginePath)) ? StoryEngineSchema.parse(await readYaml(storyEnginePath)) : defaultStoryEngine(),
    promise_ledger: (await pathExists(promiseLedgerPath)) ? PromiseLedgerSchema.parse(await readYaml(promiseLedgerPath)) : defaultPromiseLedger(),
  };
}

export async function updateGeneFieldStatus(
  projectName: string,
  fieldPath: string,
  status: GeneFieldStatus,
  reason: string | null,
): Promise<{ ok: true; changed_files: string[] }> {
  GeneFieldStatusSchema.parse(status);
  const root = projectRoot(projectName);
  const storyEnginePath = path.join(root, "10_bible/story_engine.yaml");
  if (!(await pathExists(storyEnginePath))) {
    await migrateWebnovelGene(projectName);
  }

  const storyEngine = StoryEngineSchema.parse(await readYaml(storyEnginePath)) as Record<string, unknown>;
  const target = resolvePath(storyEngine, fieldPath);
  if (!target || typeof target !== "object" || Array.isArray(target) || !("status" in target)) {
    throw new Error(`Gene field path must point to an object with status: ${fieldPath}`);
  }
  (target as { status: GeneFieldStatus; updated_at?: string; rejected_reason?: string }).status = status;
  if (status === "rejected" && reason) {
    (target as { rejected_reason?: string }).rejected_reason = reason;
  }
  storyEngine.updated_at = nowIso();
  StoryEngineSchema.parse(storyEngine);
  await writeYaml(storyEnginePath, storyEngine);
  await appendTrace(projectName, {
    command: `gene.${status === "rejected" ? "reject" : "approve"}`,
    artifacts: ["10_bible/story_engine.yaml"],
    metadata: { path: fieldPath, status, reason },
  });
  return { ok: true, changed_files: ["10_bible/story_engine.yaml"] };
}

function resolvePath(root: Record<string, unknown>, fieldPath: string): unknown {
  if (!fieldPath || fieldPath.includes("..")) throw new Error(`Invalid field path: ${fieldPath}`);
  let current: unknown = root;
  for (const part of fieldPath.split(".")) {
    const match = part.match(/^([A-Za-z0-9_]+)(?:\[(\d+)])?$/);
    if (!match) throw new Error(`Invalid field path segment: ${part}`);
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[match[1]];
    if (match[2] !== undefined) {
      if (!Array.isArray(current)) return null;
      current = current[Number(match[2])];
    }
  }
  return current;
}

export function assertPromiseId(value: string): string {
  return assertSafeId(value, "promiseId");
}
