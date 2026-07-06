import path from "node:path";
import { listFilesRecursive, pathExists, readText, readYaml, writeText } from "./fs-utils.js";
import { assertSafeId, projectRoot } from "./paths.js";
import { nowIso } from "./time.js";
import { PromiseLedgerSchema, StoryEngineSchema, FactDeltaSchema } from "./schemas.js";
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
    `It also follows the narrative mechanism minimal injection principle: executable project state only, no theory dump.`,
    ``,
  ];

  const geneSummary = await narrativeMechanismSummary(root);
  if (geneSummary.length > 0) {
    body.push("## Narrative Mechanism Reminders", "", ...geneSummary, "");
  }

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

async function narrativeMechanismSummary(root: string): Promise<string[]> {
  const output: string[] = [];
  const storyEnginePath = path.join(root, "10_bible/story_engine.yaml");
  if (await pathExists(storyEnginePath)) {
    try {
      const storyEngine = StoryEngineSchema.parse(await readYaml(storyEnginePath));
      if (storyEngine.core_emotion.value && storyEngine.core_emotion.status !== "rejected") {
        output.push(`- 当前核心情绪：${formatValue(storyEngine.core_emotion.value)}（${storyEngine.core_emotion.status}）`);
      }
      const activeEngines = storyEngine.story_engines
        .filter((item) => item.status === "approved_reference" || item.status === "experimental")
        .slice(0, 3)
        .map((item) => `${item.name}${item.effective_scope ? ` / ${item.effective_scope}` : ""}`);
      if (activeEngines.length > 0) output.push(`- 启用中的故事引擎：${activeEngines.join("；")}`);
      const antiGenes = storyEngine.anti_genes
        .filter((item) => item.status !== "rejected")
        .slice(0, 3)
        .map((item) => item.description);
      if (antiGenes.length > 0) output.push(`- 叙事禁止项：${antiGenes.join("；")}`);
      const drift = storyEngine.gene_drift_candidates.slice(-2).map((item) => `${item.from} -> ${item.to}`);
      if (drift.length > 0) output.push(`- 需要对齐的引擎漂移候选：${drift.join("；")}`);
    } catch {
      output.push("- story_engine.yaml 无法解析，已跳过叙事机制摘要。");
    }
  }

  const promiseLedgerPath = path.join(root, "30_plot/promise_ledger.yaml");
  if (await pathExists(promiseLedgerPath)) {
    try {
      const ledger = PromiseLedgerSchema.parse(await readYaml(promiseLedgerPath));
      const relevant = ledger.promises
        .filter((item) => ["open", "delayed"].includes(item.status) || item.risk === "high")
        .slice(0, 5)
        .map((item) => `${item.id}: ${item.reader_expectation}（${item.status}, ${item.obligation_level}, ${item.tension_policy}）`);
      if (relevant.length > 0) {
        output.push("- 当前相关期待：");
        output.push(...relevant.map((item) => `  - ${item}`));
      }
    } catch {
      output.push("- promise_ledger.yaml 无法解析，已跳过读者期待摘要。");
    }
  }
  return output;
}

function formatValue(value: string | string[] | Record<string, unknown>): string {
  if (Array.isArray(value)) return value.join("；");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
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
