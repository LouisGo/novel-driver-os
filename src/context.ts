import path from "node:path";
import { listFilesRecursive, pathExists, readText, readYaml, writeText } from "./fs-utils.js";
import { assertSafeId, projectRoot } from "./paths.js";
import { nowIso } from "./time.js";
import { FactDeltaSchema } from "./schemas.js";
import { appendTrace } from "./trace.js";
import { listStorycraftArtifacts } from "./storycraft.js";

export async function buildContextPacket(projectName: string, chapter: string): Promise<string> {
  assertSafeId(chapter, "chapter");
  const root = projectRoot(projectName);
  const outputPath = path.join(root, "80_context", `context_packet_${chapter}.md`);
  const shortTermTentativeVibes = await shortTermTentativeVibeFiles(root, chapter);
  const sections: Array<{ title: string; files: string[] }> = [
    { title: "Project", files: ["project.yaml"] },
    { title: "Book Profile", files: ["10_bible/book_profile.yaml"] },
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
    { title: "Storycraft Artifacts", files: (await listStorycraftArtifacts(projectName)).slice(0, 8).map((artifact) => artifact.content_file) },
    { title: "Ghost Resonance", files: ["ghost_resonance_report.md"] },
    { title: "Confirmed Vibes", files: await relativeFiles(root, "01_intake", "confirmed_vibes.md") },
    { title: "Short-Term Tentative Vibes", files: shortTermTentativeVibes },
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
  await appendTrace(projectName, {
    command: "context.build",
    artifacts: [path.relative(root, outputPath).replaceAll(path.sep, "/")],
    metadata: { chapter },
  });
  return outputPath;
}

async function relativeFiles(root: string, dir: string, suffix: string): Promise<string[]> {
  const base = path.join(root, dir);
  const files = await listFilesRecursive(base);
  return files
    .filter((file) => file.endsWith(suffix))
    .map((file) => path.relative(root, file).replaceAll(path.sep, "/"));
}

async function shortTermTentativeVibeFiles(root: string, targetChapter: string): Promise<string[]> {
  const target = chapterNumber(targetChapter);
  if (target === null) return [];

  const files = await relativeFiles(root, "01_intake", "tentative_vibes.md");
  const output: string[] = [];
  for (const relative of files) {
    const full = path.join(root, relative);
    const text = await readText(full);
    if (!text.includes("vibe_") || !text.includes("ttl: short_term")) continue;

    const factDeltaPath = path.join(path.dirname(full), "fact_delta.yaml");
    if (!(await pathExists(factDeltaPath))) continue;

    try {
      const factDelta = FactDeltaSchema.parse(await readYaml(factDeltaPath));
      const source = chapterNumber(factDelta.chapter);
      if (source !== null && target >= source && target - source <= 3) {
        output.push(relative);
      }
    } catch {
      // Invalid capsules are reported by validate; context skips unsafe tentative memory.
    }
  }
  return output;
}

function chapterNumber(chapter: string): number | null {
  const match = chapter.match(/^ch[_-]?(\d+)$/i);
  return match ? Number(match[1]) : null;
}
