import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

export async function appendText(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

export async function readYaml<T = unknown>(filePath: string): Promise<T> {
  return YAML.parse(await readText(filePath)) as T;
}

export async function writeYaml(filePath: string, value: unknown): Promise<void> {
  await writeText(filePath, YAML.stringify(value, { lineWidth: 0 }));
}

export async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  if (!(await pathExists(dir))) return out;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

export async function listImmediateDirs(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name));
}

export async function copyFile(source: string, target: string): Promise<void> {
  await ensureDir(path.dirname(target));
  await fs.copyFile(source, target);
}
