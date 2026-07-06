import path from "node:path";
import { findPacket, updatePacket } from "./input.js";
import { ensureDir, readText, writeText, writeYaml } from "./fs-utils.js";
import { assertSafeId, projectRoot } from "./paths.js";
import { nowIso } from "./time.js";
import { AuthorInputPacket } from "./schemas.js";

export const INTAKE_FILES = [
  "fact_delta.yaml",
  "atmosphere_triads.md",
  "confirmed_vibes.md",
  "tentative_vibes.md",
  "intention_hypotheses.yaml",
  "conflict_footnotes.md",
  "retcon_debt_update.yaml",
  "style_candidates.md",
  "memory_patch.yaml",
  "alignment_questions.md",
];

export interface IntakeResult {
  inputId: string;
  intakeDir: string;
  hypothesisIds: string[];
}

export async function createChapterIntake(projectName: string, inputId: string): Promise<IntakeResult> {
  assertSafeId(inputId, "inputId");
  const { packet } = await findPacket(projectName, inputId);
  if (!["chapter", "fragment"].includes(packet.detected_type)) {
    throw new Error(`Input ${inputId} is ${packet.detected_type}; chapter intake requires chapter or fragment.`);
  }
  if (!["triaged", "routed"].includes(packet.status)) {
    throw new Error(`Input ${inputId} is ${packet.status}; chapter intake only accepts triaged or routed inputs.`);
  }

  const root = projectRoot(projectName);
  const sourcePath = path.join(root, packet.raw_source_path);
  const rawText = await readText(sourcePath);
  const intakeDir = path.join(root, "01_intake", inputId);
  await ensureDir(intakeDir);

  await writeYaml(path.join(intakeDir, "fact_delta.yaml"), buildFactDelta(packet, rawText));
  await writeText(path.join(intakeDir, "atmosphere_triads.md"), buildAtmosphereTriads(packet, rawText));
  await writeText(path.join(intakeDir, "confirmed_vibes.md"), `# Confirmed Vibes - ${inputId}

Only author-confirmed vibes should be appended here.
`);
  await writeText(path.join(intakeDir, "tentative_vibes.md"), `# Tentative Vibes - ${inputId}

Unconfirmed but potentially useful vibes. These are short-term only and cannot enter canon.
`);
  await writeYaml(path.join(intakeDir, "intention_hypotheses.yaml"), buildIntentions(packet, rawText));
  await writeText(path.join(intakeDir, "conflict_footnotes.md"), buildConflictFootnotes(packet));
  await writeYaml(path.join(intakeDir, "retcon_debt_update.yaml"), {
    entry: null,
    note: "No accepted retcon patch recorded by MVP intake. Use `novel debt add` if author accepts a continuity patch.",
  });
  await writeText(path.join(intakeDir, "style_candidates.md"), buildStyleCandidates(packet, rawText));
  await writeYaml(path.join(intakeDir, "memory_patch.yaml"), buildMemoryPatch(packet, rawText));
  await writeText(path.join(intakeDir, "alignment_questions.md"), buildAlignmentQuestions(packet));

  const nextPacket: AuthorInputPacket = {
    ...packet,
    status: "pending_confirmation",
    recommended_actions: [
      "review_fact_delta",
      "confirm_or_reject_vibe",
      "review_intention_hypotheses",
      "approve_or_reject_memory_patch",
    ],
  };
  await updatePacket(projectName, nextPacket, "processed");

  return {
    inputId,
    intakeDir,
    hypothesisIds: ["vibe_a", "vibe_b", "vibe_c"],
  };
}

export async function confirmVibe(projectName: string, inputId: string, hypothesisId: string): Promise<void> {
  assertSafeId(inputId, "inputId");
  assertSafeId(hypothesisId, "hypothesisId");
  const root = projectRoot(projectName);
  const intakeDir = path.join(root, "01_intake", inputId);
  const triadsPath = path.join(intakeDir, "atmosphere_triads.md");
  const triads = await readText(triadsPath);
  const blocks = parseVibeBlocks(triads);
  const selected = blocks.find((block) => block.id === hypothesisId);
  if (!selected) {
    throw new Error(`Vibe hypothesis not found: ${hypothesisId}. Available: ${blocks.map((block) => block.id).join(", ")}`);
  }

  const confirmedPath = path.join(intakeDir, "confirmed_vibes.md");
  const tentativePath = path.join(intakeDir, "tentative_vibes.md");
  await writeText(confirmedPath, `# Confirmed Vibes - ${inputId}

## Confirmed ${selected.id}

confirmed_at: ${nowIso()}

${markVibeConfirmed(selected.content)}
`);

  const tentative = blocks
    .filter((block) => block.id !== selected.id)
    .map((block) => `## Tentative ${block.id}

status: tentative
ttl: short_term
cannot_enter_canon: true

${block.content.trim()}`)
    .join("\n\n");
  await writeText(tentativePath, `# Tentative Vibes - ${inputId}

${tentative || "_No tentative vibes._"}
`);
}

function buildFactDelta(packet: AuthorInputPacket, rawText: string): unknown {
  const chapter = packet.target_scope.chapter ?? "unknown_chapter";
  const firstLine = meaningfulLines(rawText)[0] ?? "作者提交了新的章节文本。";
  return {
    chapter,
    source: "human",
    new_facts: [
      `作者提交了 ${chapter} 的正文/片段。`,
      `文本锚点：${firstLine}`,
    ],
    character_changes: packet.target_scope.entity
      ? { [packet.target_scope.entity]: ["存在新的行为或关系表达候选，需作者确认。"] }
      : {},
    hooks_opened: ["该输入可能打开新的情绪、关系或剧情钩子，需人工确认。"],
    hooks_closed: [],
    constraints_for_future: ["不得把本次 mock intake 的推断直接写入正史。"],
    source_refs: [{ file: packet.raw_source_path }],
  };
}

function buildAtmosphereTriads(packet: AuthorInputPacket, rawText: string): string {
  const evidence = evidenceLines(rawText);
  const e1 = evidence[0] ?? packet.raw_text_excerpt;
  const e2 = evidence[1] ?? e1;
  const e3 = evidence[2] ?? e2;
  return `# Atmospheric Triads - ${packet.input_id}

## vibe_a: 克制的关心

解释：
角色可能通过很小的动作表达强烈在意，情绪不外放。

证据：
1. ${quoteEvidence(e1)}

confidence: 0.72
requires_confirmation: true
status: tentative

## vibe_b: 冷淡的自我保护

解释：
表面冷淡可能不是拒绝，而是避免暴露依赖或软肋。

证据：
1. ${quoteEvidence(e2)}

confidence: 0.66
requires_confirmation: true
status: tentative

## vibe_c: 危险前的安静

解释：
简短对白和克制动作可能在制造事件爆发前的静默压力。

证据：
1. ${quoteEvidence(e3)}

confidence: 0.58
requires_confirmation: true
status: tentative
`;
}

function buildIntentions(packet: AuthorInputPacket, rawText: string): unknown {
  const evidence = evidenceLines(rawText);
  const chapter = packet.target_scope.chapter ?? "this_input";
  return {
    intention_hypotheses: [
      {
        id: `intent_${chapter}_01`,
        level: "L1_explicit",
        content: "作者明确提交了这段文本，希望系统接住它并生成候选记忆补丁。",
        evidence: ["human_input_packet", packet.raw_source_path],
        confidence: 1,
        ttl: "permanent",
        can_enter_decision_log: true,
        status: "pending_confirmation",
      },
      {
        id: `intent_${chapter}_02`,
        level: "L2_strong_inference",
        content: "作者可能希望保留动作和对白中的潜台词，而不是用心理解释说破。",
        evidence: [evidence[0] ?? packet.raw_text_excerpt],
        confidence: 0.72,
        ttl: "5_chapters",
        can_enter_decision_log: "needs_confirmation",
        status: "tentative",
      },
      {
        id: `intent_${chapter}_03`,
        level: "L3_weak_guess",
        content: "这段文本可能在为后续关系推进或危险升级埋一个短期情绪锚点。",
        evidence: [evidence[1] ?? evidence[0] ?? packet.raw_text_excerpt],
        confidence: 0.38,
        ttl: "3_chapters",
        can_enter_decision_log: false,
        status: "temporary",
      },
    ],
  };
}

function buildConflictFootnotes(packet: AuthorInputPacket): string {
  return `# Conflict Footnotes - ${packet.input_id}

## Footnote 001

检测到一个小注脚：

MVP 规则引擎暂未发现明确正史冲突，但该输入仍可能与已有设定、人物状态或时间线存在细微偏移。

如果你是有意为之，例如想让角色偏航或暂时隐藏真实原因，可以忽略。
如果是笔误，系统未来可以生成一个 50 字以内的圆场补丁。

建议：
- 忽略，视为作者有意偏航
- 生成圆场补丁
- 手动修改原文
`;
}

function buildStyleCandidates(packet: AuthorInputPacket, rawText: string): string {
  const evidence = evidenceLines(rawText)[0] ?? packet.raw_text_excerpt;
  return `# Style Candidates - ${packet.target_scope.chapter ?? packet.input_id}

观察：
1. 作者可能倾向于用动作和对白表达情绪，而不是直接解释心理。
2. 关键关系变化可以通过微动作呈现。
3. 章末或片段收束可以依赖不安感，而不是强行制造钩子。

证据：
- ${quoteEvidence(evidence)}

状态：
candidate only，不进入 style_bible，等待 Weekly Alignment 或作者确认。
`;
}

function buildMemoryPatch(packet: AuthorInputPacket, rawText: string): unknown {
  const chapter = packet.target_scope.chapter ?? "unknown_chapter";
  return {
    patch_id: `patch_${packet.input_id}_001`,
    requires_human_approval: true,
    created_at: nowIso(),
    source_input: packet.input_id,
    updates: {
      timeline: {
        add_event: {
          chapter,
          event: `作者提交了 ${chapter} 的正文/片段，需人工确认后再抽取正式事件。`,
        },
      },
      unresolved_hooks: {
        add: ["从本次输入中确认是否存在关系、危险或留白钩子。"],
      },
      characters: packet.target_scope.entity
        ? {
            [packet.target_scope.entity]: {
              candidates: ["本次文本可能包含新的情绪表达规则或关系状态。"],
            },
          }
        : {},
      raw_evidence_excerpt: rawText.trim().slice(0, 300),
    },
  };
}

function buildAlignmentQuestions(packet: AuthorInputPacket): string {
  return `# Alignment Questions - ${packet.input_id}

1. 这段输入的核心氛围更接近 vibe_a、vibe_b 还是 vibe_c？
2. L2 意图“保留潜台词而不说破”是否符合你的真实意图？
3. 这段内容是否允许进入长期记忆，还是只作为短期候选？
`;
}

function parseVibeBlocks(markdown: string): Array<{ id: string; content: string }> {
  const lines = markdown.split(/\r?\n/);
  const blocks: Array<{ id: string; content: string }> = [];
  let current: { id: string; content: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(vibe_[a-z0-9_-]+):/i);
    if (match) {
      if (current) blocks.push({ id: current.id, content: current.content.join("\n") });
      current = { id: match[1], content: [line] };
      continue;
    }
    if (current) current.content.push(line);
  }
  if (current) blocks.push({ id: current.id, content: current.content.join("\n") });
  return blocks;
}

function markVibeConfirmed(content: string): string {
  const lines = content.trim().split(/\r?\n/);
  let sawRequiresConfirmation = false;
  let sawStatus = false;
  const updated = lines.map((line) => {
    if (/^requires_confirmation:\s*/.test(line)) {
      sawRequiresConfirmation = true;
      return "requires_confirmation: false";
    }
    if (/^status:\s*/.test(line)) {
      sawStatus = true;
      return "status: confirmed";
    }
    return line;
  });

  if (!sawRequiresConfirmation) updated.push("requires_confirmation: false");
  if (!sawStatus) updated.push("status: confirmed");
  return updated.join("\n").trim();
}

function meaningfulLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function evidenceLines(rawText: string): string[] {
  const lines = meaningfulLines(rawText);
  return lines.length > 0 ? lines.slice(0, 4) : [rawText.trim().slice(0, 160)];
}

function quoteEvidence(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "（无可用原文证据）";
  if ((clean.startsWith("“") && clean.endsWith("”")) || (clean.startsWith("\"") && clean.endsWith("\""))) {
    return clean.slice(0, 160);
  }
  return `“${clean.slice(0, 160)}”`;
}
