import path from "node:path";
import { listFilesRecursive, pathExists, readText, writeText } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { nowIso } from "./time.js";

export async function buildContextPacket(projectName: string, chapter: string): Promise<string> {
  const root = projectRoot(projectName);
  const outputPath = path.join(root, "80_context", `context_packet_${chapter}.md`);
  const sections: Array<{ title: string; files: string[] }> = [
    { title: "Project", files: ["project.yaml"] },
    { title: "Canon Registry", files: ["10_bible/canon_registry.md"] },
    { title: "Intentional Ambiguity", files: ["10_bible/intentional_ambiguity.md"] },
    { title: "Open Questions", files: ["10_bible/open_questions.md"] },
    { title: "Characters", files: await relativeFiles(root, "20_entities/characters", ".yaml") },
    { title: "Timeline", files: ["30_plot/timeline.jsonl"] },
    { title: "Unresolved Hooks", files: ["30_plot/unresolved_hooks.md"] },
    { title: "Style Bible", files: ["40_style/style_bible.md"] },
    { title: "Anti Style", files: ["40_style/anti_style.md"] },
    { title: "Aspirational Style", files: ["40_style/aspirational_style.md"] },
    { title: "Retcon Debt", files: ["70_debt/retcon_debt.yaml"] },
    { title: "Ghost Resonance", files: ["ghost_resonance_report.md"] },
    { title: "Confirmed Vibes", files: await relativeFiles(root, "01_intake", "confirmed_vibes.md") },
    { title: "Tentative Vibes", files: await relativeFiles(root, "01_intake", "tentative_vibes.md") },
  ];

  const body: string[] = [
    `# Context Packet - ${chapter}`,
    ``,
    `generated_at: ${nowIso()}`,
    ``,
    `This packet intentionally avoids full manuscript ingestion, deep archive, raw trace, and unconfirmed weak guesses.`,
    ``,
  ];

  for (const section of sections) {
    body.push(`## ${section.title}`, "");
    for (const relative of section.files) {
      const full = path.join(root, relative);
      if (!(await pathExists(full))) continue;
      const content = await readText(full);
      body.push(`### ${relative}`, "", "```", content.trim().slice(0, 4000), "```", "");
    }
  }

  await writeText(outputPath, body.join("\n"));
  return outputPath;
}

async function relativeFiles(root: string, dir: string, suffix: string): Promise<string[]> {
  const base = path.join(root, dir);
  const files = await listFilesRecursive(base);
  return files
    .filter((file) => file.endsWith(suffix))
    .map((file) => path.relative(root, file).replaceAll(path.sep, "/"));
}
