import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { ensureDir, pathExists, readText, writeText } from "./fs-utils.js";
import { chapterSortKey, readChapterIndex } from "./chapter.js";
import { projectRoot, relativeToProject } from "./paths.js";
import { appendTrace } from "./trace.js";
import { compactTimestamp } from "./time.js";

const execFileAsync = promisify(execFile);

export interface ExportChaptersOptions {
  format: string;
  out?: string;
  zip?: string;
}

export interface ExportChaptersResult {
  ok: true;
  exported_files: string[];
  zip_file: string | null;
}

export async function exportChapters(projectName: string, options: ExportChaptersOptions): Promise<ExportChaptersResult> {
  if (options.format !== "txt") {
    throw new Error(`Unsupported export format ${options.format}. Only txt is supported.`);
  }
  if (!options.out && !options.zip) {
    throw new Error("export chapters requires --out <dir> or --zip <file>.");
  }

  const root = projectRoot(projectName);
  const index = await readChapterIndex(path.join(root, "50_chapters/chapter_index.yaml"));
  const hotChapters = index.chapters
    .filter((entry) => entry.layer === "hot")
    .sort((a, b) => chapterSortKey(a.chapter) - chapterSortKey(b.chapter) || a.chapter.localeCompare(b.chapter));
  if (hotChapters.length === 0) {
    throw new Error("No accepted hot chapters found for export.");
  }
  assertNoMissingNumericChapters(hotChapters.map((entry) => entry.chapter));

  const outDir = options.out
    ? path.resolve(options.out)
    : path.join(root, "90_archive/exports", `export_${compactTimestamp()}`);
  await ensureDir(outDir);

  const exportedAbs: string[] = [];
  for (const entry of hotChapters) {
    const source = path.join(root, entry.file);
    if (!(await pathExists(source))) {
      throw new Error(`Chapter index points to missing file: ${entry.file}`);
    }
    const target = path.join(outDir, `${entry.chapter}.txt`);
    await writeText(target, await readText(source));
    exportedAbs.push(target);
  }

  let zipFile: string | null = null;
  if (options.zip) {
    const zipPath = path.resolve(options.zip);
    await ensureDir(path.dirname(zipPath));
    await execFileAsync("zip", ["-q", "-j", zipPath, ...exportedAbs]);
    zipFile = zipPath;
  }

  const exportedFiles = exportedAbs.map((file) => path.relative(process.cwd(), file).replaceAll(path.sep, "/"));
  await appendTrace(projectName, {
    command: "export.chapters",
    artifacts: [
      ...exportedAbs.map((file) => relativeToProject(projectName, file)).filter((value) => !value.startsWith("..")),
      ...(zipFile ? [zipFile] : []),
    ],
    metadata: { format: options.format, out: outDir, zip: zipFile },
  });

  return {
    ok: true,
    exported_files: exportedFiles,
    zip_file: zipFile,
  };
}

function assertNoMissingNumericChapters(chapters: string[]): void {
  const numbers = chapters.map((chapter) => {
    const match = chapter.match(/^ch[_-]?(\d+)$/i);
    return match ? Number(match[1]) : null;
  });
  if (numbers.some((value) => value === null)) return;
  const numeric = numbers as number[];
  for (let expected = numeric[0]; expected <= numeric[numeric.length - 1]; expected += 1) {
    if (!numeric.includes(expected)) {
      throw new Error(`Missing accepted chapter ch${String(expected).padStart(4, "0")} in chapter_index.yaml.`);
    }
  }
}
