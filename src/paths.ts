import path from "node:path";

export const PROJECTS_DIR = "projects";

export function repoRoot(): string {
  return process.cwd();
}

export function projectsRoot(root = repoRoot()): string {
  return path.join(root, PROJECTS_DIR);
}

export function projectRoot(projectName: string, root = repoRoot()): string {
  return path.join(projectsRoot(root), projectName);
}

export function relativeToProject(projectName: string, absolutePath: string, root = repoRoot()): string {
  return path.relative(projectRoot(projectName, root), absolutePath).replaceAll(path.sep, "/");
}

export function safeName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_\-.]+/g, "_").replace(/^_+|_+$/g, "");
}
