import path from "node:path";
import { ensureDir, pathExists, readText, readYaml, writeText, writeYaml } from "./fs-utils.js";
import { findPacket } from "./input.js";
import { assertSafeId, projectRoot, relativeToProject } from "./paths.js";
import { readReviewDecision } from "./review.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";
import { createSnapshot } from "./snapshot.js";

export type ChapterLayer = "hot" | "warm" | "cold";

export interface ChapterIndexEntry {
  chapter: string;
  number: number | null;
  title: string;
  export_name: string;
  layer: ChapterLayer;
  file: string;
  source_input: string;
  variant_id?: string | null;
  accepted_at: string;
}

export interface ChapterIndex {
  chapters: ChapterIndexEntry[];
}

export interface ChapterAcceptResult {
  ok: true;
  input_id: string;
  chapter: string;
  layer: ChapterLayer;
  changed_files: string[];
}

export async function acceptChapter(
  projectName: string,
  inputId: string,
  chapter: string,
  layer: string,
  variantId?: string | null,
): Promise<ChapterAcceptResult> {
  assertSafeId(inputId, "inputId");
  assertSafeId(chapter, "chapter");
  const normalizedLayer = normalizeLayer(layer);
  const { packet } = await findPacket(projectName, inputId);
  const decision = await readReviewDecision(projectName, inputId);
  if (decision?.decision !== "approved" && packet.status !== "applied") {
    throw new Error(`Input ${inputId} must be approved or applied before chapter accept.`);
  }

  const root = projectRoot(projectName);
  const sourceText = variantId
    ? await readText(await variantFilePath(root, inputId, variantId))
    : await readText(path.join(root, packet.raw_source_path));
  const manuscript = manuscriptText(sourceText);
  const title = extractChapterTitle(manuscript, chapter);
  const number = chapterSortKey(chapter);
  const exportName = buildChapterExportName(chapter, title);
  const chapterPath = path.join(root, "50_chapters", normalizedLayer, `${chapter}.txt`);

  await createSnapshot(projectName, `before_chapter_accept_${chapter}`);
  await writeText(chapterPath, manuscript);

  const indexPath = path.join(root, "50_chapters/chapter_index.yaml");
  const index = await readChapterIndex(indexPath);
  const nextEntry: ChapterIndexEntry = {
    chapter,
    number: Number.isFinite(number) && number !== Number.MAX_SAFE_INTEGER ? number : null,
    title,
    export_name: exportName,
    layer: normalizedLayer,
    file: relativeToProject(projectName, chapterPath),
    source_input: inputId,
    variant_id: variantId ?? null,
    accepted_at: nowIso(),
  };
  const chapters = index.chapters.filter((entry) => entry.chapter !== chapter || entry.layer !== normalizedLayer);
  chapters.push(nextEntry);
  chapters.sort((a, b) => chapterSortKey(a.chapter) - chapterSortKey(b.chapter) || a.chapter.localeCompare(b.chapter));
  await writeYaml(indexPath, { chapters });

  const changedFiles = [
    relativeToProject(projectName, chapterPath),
    "50_chapters/chapter_index.yaml",
  ];
  await appendTrace(projectName, {
    command: "chapter.accept",
    input_id: inputId,
    artifacts: changedFiles,
    metadata: { chapter, layer: normalizedLayer, variant_id: variantId ?? null },
  });

  return {
    ok: true,
    input_id: inputId,
    chapter,
    layer: normalizedLayer,
    changed_files: changedFiles,
  };
}

export async function readChapterIndex(indexPath: string): Promise<ChapterIndex> {
  if (!(await pathExists(indexPath))) return { chapters: [] };
  const parsed = await readYaml<Partial<ChapterIndex>>(indexPath);
  return {
    chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
  };
}

export function normalizeLayer(layer: string): ChapterLayer {
  if (["hot", "warm", "cold"].includes(layer)) return layer as ChapterLayer;
  throw new Error(`Invalid chapter layer ${layer}. Expected hot, warm or cold.`);
}

export function chapterSortKey(chapter: string): number {
  const match = chapter.match(/^ch[_-]?(\d+)$/i);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function buildChapterExportName(chapter: string, title: string): string {
  const number = chapterSortKey(chapter);
  const prefix = Number.isFinite(number) && number !== Number.MAX_SAFE_INTEGER
    ? String(number).padStart(4, "0")
    : chapter;
  return `${prefix}.${sanitizeFileName(title)}.txt`;
}

export function extractChapterTitle(manuscript: string, chapter: string): string {
  const firstMeaningful = manuscript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstMeaningful) return chapter;
  const title = firstMeaningful.replace(/^#+\s*/, "").trim();
  return title || chapter;
}

function manuscriptText(rawText: string): string {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && isMetadataTagLine(lines[0])) lines.shift();
  return lines.join("\n").trim();
}

function isMetadataTagLine(line: string | undefined): boolean {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed.startsWith("#")) return false;
  return /^(?:#[\p{L}\p{N}_-]+\s*)+$/u.test(trimmed);
}

function sanitizeFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "未命名章节";
}

async function variantFilePath(root: string, inputId: string, variantId: string): Promise<string> {
  assertSafeId(variantId, "variantId");
  const manifestPath = path.join(root, "50_chapters/variants", inputId, "variants.yaml");
  const manifest = await readYaml<{ winner_variant_id?: string | null; variants?: Array<{ variant_id: string; file: string }> }>(manifestPath);
  if (manifest.winner_variant_id !== variantId) {
    throw new Error(`Variant ${variantId} is not the decided winner. Run variant decide first.`);
  }
  const found = manifest.variants?.find((variant) => variant.variant_id === variantId);
  if (!found) throw new Error(`Variant not found: ${variantId}`);
  return path.join(root, found.file);
}
