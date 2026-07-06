import path from "node:path";
import { listFilesRecursive, pathExists, readText, writeText } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { nowIso } from "./time.js";

export async function ghostScan(projectName: string): Promise<string> {
  const root = projectRoot(projectName);
  const discardedPath = path.join(root, "40_style/discarded_brilliance.md");
  const discarded = await readText(discardedPath);
  const state = await readProjectState(root);
  const items = extractDiscardedItems(discarded);
  const matches = items.filter((item) => item.triggers.some((trigger) => looseIncludes(state, trigger)));
  const reportPath = path.join(root, "ghost_resonance_report.md");

  const report = `# Ghost Resonance Report

generated_at: ${nowIso()}

## Matches

${matches.length === 0 ? "_No trigger matched current project state._" : matches.map((item) => `### ${item.id}

latent_value: ${item.latentValue || "未填写"}

matched_triggers:
${item.triggers.map((trigger) => `- ${trigger}`).join("\n")}

suggested_future_use:
- 作为候选提醒，不直接写入正史。
`).join("\n")}

## Scan Scope

- 30_plot/
- 10_bible/
- 20_entities/
- 40_style/discarded_brilliance.md
`;

  await writeText(reportPath, report);
  return reportPath;
}

async function readProjectState(root: string): Promise<string> {
  const scopes = ["30_plot", "10_bible", "20_entities"].map((dir) => path.join(root, dir));
  const files: string[] = [];
  for (const scope of scopes) files.push(...await listFilesRecursive(scope));
  const chunks: string[] = [];
  for (const file of files) {
    if (await pathExists(file)) chunks.push(await readText(file));
  }
  return chunks.join("\n").toLowerCase();
}

function extractDiscardedItems(markdown: string): Array<{ id: string; triggers: string[]; latentValue?: string }> {
  const blocks = markdown.split(/^##\s+/m).slice(1);
  return blocks.map((block) => {
    const id = block.split(/\r?\n/)[0]?.trim() || "unknown_discarded";
    const triggerSection = block.match(/resurrection_triggers:\s*\n((?:\s+-\s+["']?[^"'\n]+["']?\s*\n?)*)/m)?.[1] ?? "";
    const triggerMatches = [...triggerSection.matchAll(/^\s*-\s+["']?([^"'\n]+)["']?\s*$/gm)].map((match) => match[1].trim());
    const latentValue = block.match(/latent_value:\s*["']?([^"'\n]+)["']?/m)?.[1];
    return { id, triggers: triggerMatches, latentValue };
  });
}

function looseIncludes(state: string, trigger: string): boolean {
  const words = trigger
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2);
  if (words.length === 0) return false;
  return words.some((word) => state.includes(word));
}
