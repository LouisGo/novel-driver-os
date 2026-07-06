import path from "node:path";
import { ensureDir, listFilesRecursive, pathExists, readText, readYaml, writeText, writeYaml } from "./fs-utils.js";
import { assertSafeId, projectRoot, relativeToProject, safeName } from "./paths.js";
import { compactTimestamp, nowIso } from "./time.js";
import { appendTrace } from "./trace.js";
import { findPacket } from "./input.js";
import { StorycraftKind, StorycraftManifest, StorycraftManifestSchema } from "./schemas.js";
import { storycraftKindLabel } from "./display.js";

export interface CreateStorycraftOptions {
  fromFile?: string;
  stdinText?: string;
  sourceInput?: string | null;
  chapter?: string | null;
  volume?: string | null;
  entity?: string | null;
  label?: string | null;
  summary?: string | null;
  sourceActor?: "human" | "agent" | "model";
}

export interface StorycraftCreateResult {
  ok: true;
  artifact: StorycraftManifest;
  changed_files: string[];
  next_commands: string[];
}

export async function createStorycraftArtifact(
  projectName: string,
  kind: StorycraftKind,
  options: CreateStorycraftOptions,
): Promise<StorycraftCreateResult> {
  const root = projectRoot(projectName);
  const content = await storycraftContent(projectName, options);
  const label = options.label?.trim() || defaultLabel(kind, options);
  const artifactId = `${kind}_${compactTimestamp()}_${safeName(label).slice(0, 24) || "artifact"}`;
  assertSafeId(artifactId, "artifactId");

  const dir = path.join(root, "35_storycraft", kind);
  await ensureDir(dir);

  const contentPath = path.join(dir, `${artifactId}.md`);
  const manifestPath = path.join(dir, `${artifactId}.yaml`);
  const contentRelative = relativeToProject(projectName, contentPath);
  const manifestRelative = relativeToProject(projectName, manifestPath);

  await writeText(contentPath, normalizeContent(kind, artifactId, label, content));
  const manifest: StorycraftManifest = {
    artifact_id: artifactId,
    project: projectName,
    kind,
    label,
    status: "report_only",
    source_input_id: options.sourceInput ?? null,
    target_scope: {
      entity: options.entity ?? null,
      chapter: options.chapter ?? null,
      volume: options.volume ?? null,
    },
    source_actor: options.sourceActor ?? "agent",
    content_file: contentRelative,
    summary: options.summary ?? summarize(content),
    created_at: nowIso(),
    next_commands: nextCommandsFor(projectName, kind, artifactId, options),
  };
  StorycraftManifestSchema.parse(manifest);
  await writeYaml(manifestPath, manifest);

  await appendTrace(projectName, {
    command: `storycraft.${kind}.create`,
    input_id: options.sourceInput ?? undefined,
    artifacts: [contentRelative, manifestRelative],
    metadata: {
      artifact_id: artifactId,
      kind,
      chapter: options.chapter ?? null,
    },
  });

  return {
    ok: true,
    artifact: manifest,
    changed_files: [contentRelative, manifestRelative],
    next_commands: manifest.next_commands,
  };
}

export async function listStorycraftArtifacts(projectName: string, kind?: StorycraftKind): Promise<StorycraftManifest[]> {
  const root = projectRoot(projectName);
  const base = path.join(root, "35_storycraft");
  const files = (await listFilesRecursive(base))
    .filter((file) => file.endsWith(".yaml"))
    .filter((file) => !kind || file.includes(`${path.sep}${kind}${path.sep}`));
  const manifests: StorycraftManifest[] = [];
  for (const file of files) {
    manifests.push(StorycraftManifestSchema.parse(await readYaml(file)));
  }
  return manifests.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function readStorycraftArtifact(
  projectName: string,
  kind: StorycraftKind,
  artifactId: string,
): Promise<{ manifest: StorycraftManifest; content: string }> {
  assertSafeId(artifactId, "artifactId");
  const root = projectRoot(projectName);
  const manifestPath = path.join(root, "35_storycraft", kind, `${artifactId}.yaml`);
  if (!(await pathExists(manifestPath))) {
    throw new Error(`Storycraft artifact not found: 35_storycraft/${kind}/${artifactId}.yaml`);
  }
  const manifest = StorycraftManifestSchema.parse(await readYaml(manifestPath));
  const contentPath = path.join(root, manifest.content_file);
  if (!(await pathExists(contentPath))) {
    throw new Error(`Storycraft content not found: ${manifest.content_file}`);
  }
  return { manifest, content: await readText(contentPath) };
}

async function storycraftContent(projectName: string, options: CreateStorycraftOptions): Promise<string> {
  if (options.stdinText !== undefined) return options.stdinText;
  if (options.fromFile) return readText(options.fromFile);
  if (options.sourceInput) {
    const { packet } = await findPacket(projectName, options.sourceInput);
    const rawText = await readText(path.join(projectRoot(projectName), packet.raw_source_path));
    return `# 原始输入 ${packet.input_id}\n\n${rawText}`;
  }
  throw new Error("storycraft create requires --from-file, --stdin, or --source-input.");
}

function normalizeContent(kind: StorycraftKind, artifactId: string, label: string, content: string): string {
  const trimmed = content.trim();
  const header = [
    `# ${storycraftKindLabel(kind)}：${label}`,
    "",
    `内部编号：${artifactId}`,
    `状态：仅作为报告，不是定稿`,
    "",
  ].join("\n");
  return trimmed.startsWith("#") ? `${trimmed}\n` : `${header}${trimmed}\n`;
}

function defaultLabel(kind: StorycraftKind, options: CreateStorycraftOptions): string {
  if (options.chapter) return `${kind}-${options.chapter}`;
  if (options.sourceInput) return `${kind}-${options.sourceInput}`;
  return kind;
}

function summarize(content: string): string {
  return content
    .replace(/^#.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function nextCommandsFor(projectName: string, kind: StorycraftKind, artifactId: string, options: CreateStorycraftOptions): string[] {
  if (kind === "premise") {
    return [`novel storycraft payoff create ${projectName} --from-file <payoff-report> --label <label>`];
  }
  if (kind === "payoff") {
    return [`novel storycraft emotion create ${projectName} --from-file <emotion-report> --label <label>`];
  }
  if (kind === "emotion") {
    return [`novel storycraft brief create ${projectName} --from-file <brief-file> --chapter ${options.chapter ?? "<chapter>"} --label <label>`];
  }
  if (kind === "gene") {
    return [`novel gene approve ${projectName} --path <fieldPath>`];
  }
  if (kind === "serial_plan") {
    return [`novel promise report ${projectName}`];
  }
  return [`novel context build ${projectName} --chapter ${options.chapter ?? "<chapter>"}`];
}
