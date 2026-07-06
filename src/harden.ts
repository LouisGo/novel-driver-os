import path from "node:path";
import { ensureDir, listFilesRecursive, pathExists, readText, writeText } from "./fs-utils.js";
import { assertSafeId, projectRoot } from "./paths.js";
import { nowIso } from "./time.js";

const HARDEN_FILES = [
  "volume_epic_summary.md",
  "canon_changes.md",
  "character_evolution.md",
  "relationship_evolution.md",
  "top_5_anchor_scenes.md",
  "atmosphere_digest.md",
  "unstructured_oddities.md",
];

export async function hardenVolume(projectName: string, volumeId: string): Promise<string> {
  assertSafeId(volumeId, "volumeId");
  const root = projectRoot(projectName);
  const candidates = [
    path.join(root, "50_chapters/cold", volumeId),
    path.join(root, "50_chapters/warm", volumeId),
  ];
  let sourceDir: string | undefined;
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      sourceDir = candidate;
      break;
    }
  }
  if (!sourceDir) {
    throw new Error(`Volume source not found: ${volumeId}. Expected 50_chapters/cold/${volumeId} or 50_chapters/warm/${volumeId}.`);
  }
  const sourceFiles = sourceDir ? await listFilesRecursive(sourceDir) : [];
  const snippets = await readSnippets(sourceFiles);
  const outputDir = path.join(root, "90_archive", volumeId, "memory_hardening");
  await ensureDir(outputDir);

  const common = `generated_at: ${nowIso()}
source_scope: ${sourceDir ? path.relative(root, sourceDir) : "none"}

`;

  await writeText(path.join(outputDir, "volume_epic_summary.md"), `# Volume Epic Summary - ${volumeId}

${common}MVP hardening summary. Source snippets:

${snippets || "_No source snippets found._"}
`);
  await writeText(path.join(outputDir, "canon_changes.md"), `# Canon Changes - ${volumeId}

${common}Only list confirmed canon changes here. MVP generated no direct canon write.
`);
  await writeText(path.join(outputDir, "character_evolution.md"), `# Character Evolution - ${volumeId}

${common}Candidate character movement should be confirmed before entering long-term canon.
`);
  await writeText(path.join(outputDir, "relationship_evolution.md"), `# Relationship Evolution - ${volumeId}

${common}Relationship changes remain proposal-level unless author confirms them.
`);
  await writeText(path.join(outputDir, "top_5_anchor_scenes.md"), `# Top 5 Anchor Scenes - ${volumeId}

${common}1. Pending manual selection.
`);
  await writeText(path.join(outputDir, "atmosphere_digest.md"), `# Atmosphere Digest - ${volumeId}

${common}Confirmed vibes should be preferred over tentative vibes.
`);
  await writeText(path.join(outputDir, "unstructured_oddities.md"), `# Unstructured Oddities - ${volumeId}

${common}保存那些不属于主线、没有明确伏笔标签、但具有“人类气味”的细节。

## Oddities

- MVP placeholder: review source snippets and preserve strange, vivid, future-useful details here.
`);

  return outputDir;
}

async function readSnippets(files: string[]): Promise<string> {
  const parts: string[] = [];
  for (const file of files.filter((value) => /\.(md|yaml|jsonl|txt)$/i.test(value)).slice(0, 8)) {
    const text = await readText(file);
    parts.push(`## ${path.basename(file)}\n\n${text.trim().slice(0, 500)}`);
  }
  return parts.join("\n\n");
}

export function hardenFileNames(): string[] {
  return HARDEN_FILES;
}
