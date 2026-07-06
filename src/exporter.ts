import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists, readText, writeText } from "./fs-utils.js";
import { buildChapterExportName, chapterSortKey, readChapterIndex } from "./chapter.js";
import { projectRoot, relativeToProject } from "./paths.js";
import { appendTrace } from "./trace.js";
import { readBookProfile } from "./book.js";

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
  const root = projectRoot(projectName);
  const book = await readBookProfile(projectName);
  const safeTitle = sanitizeFileName(book.title || projectName);
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
    : path.resolve("exports", `${safeTitle}_txt`);
  await ensureDir(outDir);

  const exportedAbs: string[] = [];
  for (const entry of hotChapters) {
    const source = path.join(root, entry.file);
    if (!(await pathExists(source))) {
      throw new Error(`Chapter index points to missing file: ${entry.file}`);
    }
    const targetName = entry.export_name || buildChapterExportName(entry.chapter, entry.title || entry.chapter);
    const target = path.join(outDir, targetName);
    await writeText(target, await readText(source));
    exportedAbs.push(target);
  }

  let zipFile: string | null = null;
  const zipTarget = options.zip ?? path.resolve("exports", `${safeTitle}.zip`);
  if (zipTarget) {
    const zipPath = path.resolve(zipTarget);
    await ensureDir(path.dirname(zipPath));
    if (await pathExists(zipPath)) {
      await fs.rm(zipPath, { force: true });
    }
    await writeStoredZip(zipPath, exportedAbs.map((file) => ({ absolutePath: file, name: path.basename(file) })));
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

function sanitizeFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "未命名作品";
}

async function writeStoredZip(zipPath: string, files: Array<{ absolutePath: string; name: string }>): Promise<void> {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const data = await fs.readFile(file.absolutePath);
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 file names.
    local.writeUInt16LE(0, 8); // stored, no compression.
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  await fs.writeFile(zipPath, Buffer.concat([...localParts, ...centralParts, end]));
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
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
