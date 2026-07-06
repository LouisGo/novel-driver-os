import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { projectRoot } from "./paths.js";
import { appendTrace } from "./trace.js";

const execFileAsync = promisify(execFile);

export async function initProjectGit(projectName: string): Promise<{ ok: true; cwd: string }> {
  const root = projectRoot(projectName);
  await execFileAsync("git", ["init"], { cwd: root });
  await appendTrace(projectName, {
    command: "project.git-init",
    artifacts: [".git"],
    metadata: { cwd: root },
  });
  return { ok: true, cwd: root };
}
