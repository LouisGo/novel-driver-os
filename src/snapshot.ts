import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists, readYaml, writeYaml } from "./fs-utils.js";
import { projectRoot, relativeToProject, safeName } from "./paths.js";
import { appendTrace } from "./trace.js";
import { compactTimestamp, nowIso } from "./time.js";

const SNAPSHOT_SCOPES = [
  "10_bible",
  "20_entities",
  "30_plot",
  "40_style",
  "50_chapters",
  "project.yaml",
  "session.yaml",
];

export interface SnapshotResult {
  ok: true;
  snapshot_id: string;
  changed_files: string[];
}

export async function createSnapshot(projectName: string, label: string): Promise<SnapshotResult> {
  const root = projectRoot(projectName);
  const snapshotId = `snapshot_${compactTimestamp()}_${safeName(label).slice(0, 32) || "manual"}`;
  const snapshotRoot = path.join(root, "90_archive/snapshots", snapshotId);
  const stateRoot = path.join(snapshotRoot, "state");
  await ensureDir(stateRoot);

  const copied: string[] = [];
  for (const scope of SNAPSHOT_SCOPES) {
    const source = path.join(root, scope);
    if (!(await pathExists(source))) continue;
    const target = path.join(stateRoot, scope);
    await ensureDir(path.dirname(target));
    await fs.cp(source, target, { recursive: true });
    copied.push(scope);
  }

  const manifestPath = path.join(snapshotRoot, "manifest.yaml");
  await writeYaml(manifestPath, {
    snapshot_id: snapshotId,
    label,
    created_at: nowIso(),
    scopes: copied,
  });

  await appendTrace(projectName, {
    command: "snapshot.create",
    artifacts: [relativeToProject(projectName, manifestPath)],
    metadata: { snapshot_id: snapshotId, label },
  });

  return {
    ok: true,
    snapshot_id: snapshotId,
    changed_files: [relativeToProject(projectName, manifestPath)],
  };
}

export interface SnapshotRestoreResult {
  ok: true;
  snapshot_id: string;
  restored_scopes: string[];
}

export async function restoreSnapshot(projectName: string, snapshotId: string): Promise<SnapshotRestoreResult> {
  const root = projectRoot(projectName);
  const snapshotRoot = path.join(root, "90_archive/snapshots", snapshotId);
  const manifestPath = path.join(snapshotRoot, "manifest.yaml");
  if (!(await pathExists(manifestPath))) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const manifest = await readYaml<{ scopes?: string[] }>(manifestPath);
  const scopes = manifest.scopes ?? SNAPSHOT_SCOPES;
  const restored: string[] = [];
  for (const scope of scopes) {
    const source = path.join(snapshotRoot, "state", scope);
    if (!(await pathExists(source))) continue;
    const target = path.join(root, scope);
    await fs.rm(target, { recursive: true, force: true });
    await ensureDir(path.dirname(target));
    await fs.cp(source, target, { recursive: true });
    restored.push(scope);
  }

  await appendTrace(projectName, {
    command: "snapshot.restore",
    artifacts: restored,
    metadata: { snapshot_id: snapshotId },
  });

  return {
    ok: true,
    snapshot_id: snapshotId,
    restored_scopes: restored,
  };
}
