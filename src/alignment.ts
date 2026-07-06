import path from "node:path";
import { listFilesRecursive, pathExists, readText, readYaml, writeText } from "./fs-utils.js";
import { listInputs } from "./input.js";
import { projectRoot } from "./paths.js";
import { localDate, nowIso } from "./time.js";
import { AuthorInputPacket, IntentionHypothesesFileSchema } from "./schemas.js";
import { appendTrace } from "./trace.js";

export async function weeklyAlignment(projectName: string): Promise<string> {
  const root = projectRoot(projectName);
  const packets = await listInputs(projectName);
  const counts = countInputs(packets);
  const uncertainties = await collectUncertainties(root);
  const styleObservation = await collectStyleObservation(root);
  const date = localDate();
  const reportPath = path.join(root, "60_alignment/weekly_reports", `${date}_alignment_report.md`);

  const report = `# Weekly Alignment Report - ${date}

generated_at: ${nowIso()}

## 1. 本周输入回顾

- 灵感碎片数量: ${counts.inspiration}
- 正文片段数量: ${counts.chapter + counts.fragment}
- 人设候选数量: ${counts.character}
- 废案数量: ${counts.discarded_idea}
- 留白说明数量: ${counts.ambiguity}
- 风格反馈数量: ${counts.style_feedback}

## 2. 系统不确定的问题

${formatTop(uncertainties, "暂未收集到明显不确定项。")}

## 3. 需要作者确认的关键项

${formatTop(packets.filter((packet) => packet.requires_confirmation).map((packet) => `${packet.input_id}: ${packet.detected_type} / ${packet.authority_level}`), "暂无需要确认的关键项。")}

## 4. 风格偏移观察

${styleObservation}

## 5. 下周建议

- 更克制
- 更爽
- 更悬疑
- 暂停自动档
- 加强 Canon Checker
- 加强 AI 味检测

> 本报告用于校准系统理解，不会直接修改 canon_registry 或 style_bible。
`;

  await writeText(reportPath, report);
  await appendTrace(projectName, {
    command: "align.weekly",
    artifacts: [`60_alignment/weekly_reports/${date}_alignment_report.md`],
    metadata: { input_counts: counts },
  });
  return reportPath;
}

function countInputs(packets: AuthorInputPacket[]): Record<string, number> {
  const counts: Record<string, number> = {
    inspiration: 0,
    chapter: 0,
    fragment: 0,
    setting: 0,
    character: 0,
    worldbuilding: 0,
    ambiguity: 0,
    style_feedback: 0,
    discarded_idea: 0,
    feedback: 0,
    unknown: 0,
  };
  for (const packet of packets) counts[packet.detected_type] = (counts[packet.detected_type] ?? 0) + 1;
  return counts;
}

async function collectUncertainties(root: string): Promise<string[]> {
  const output: string[] = [];
  const intakeFiles = await listFilesRecursive(path.join(root, "01_intake"));
  for (const file of intakeFiles.filter((value) => value.endsWith("intention_hypotheses.yaml"))) {
    try {
      const parsed = IntentionHypothesesFileSchema.parse(await readYaml(file));
      for (const item of parsed.intention_hypotheses) {
        if (item.status !== "confirmed") {
          output.push(`${item.id}: ${item.content} (confidence ${item.confidence}, ttl ${item.ttl})`);
        }
      }
    } catch {
      output.push(`${path.relative(root, file)}: intention_hypotheses could not be parsed.`);
    }
  }

  for (const file of intakeFiles.filter((value) => value.endsWith("tentative_vibes.md"))) {
    const text = await readText(file);
    if (text.includes("vibe_")) output.push(`${path.relative(root, file)}: 存在未确认氛围。`);
  }

  const openQuestions = path.join(root, "10_bible/open_questions.md");
  if (await pathExists(openQuestions)) {
    const text = await readText(openQuestions);
    const lines = text.split(/\r?\n/).filter((line) => /^[-0-9.]/.test(line.trim()));
    output.push(...lines.slice(0, 3));
  }

  return output.slice(0, 5);
}

async function collectStyleObservation(root: string): Promise<string> {
  const candidates = path.join(root, "40_style/style_candidates.md");
  const antiStyle = path.join(root, "40_style/anti_style.md");
  const chunks: string[] = [];
  if (await pathExists(candidates)) chunks.push((await readText(candidates)).trim().slice(0, 500));
  if (await pathExists(antiStyle)) chunks.push((await readText(antiStyle)).trim().slice(0, 300));
  if (chunks.length === 0) return "暂无足够 style_candidates。建议继续收集作者反馈，不要过早固化 style_bible。";
  return `${chunks.join("\n\n")}\n\n观察仍为候选，等待作者确认。`;
}

function formatTop(items: string[], emptyText: string): string {
  if (items.length === 0) return emptyText;
  return items.slice(0, 5).map((item) => `- ${item}`).join("\n");
}
