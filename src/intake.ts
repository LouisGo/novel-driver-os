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

export const OPTIONAL_INTAKE_FILES = [
  "chapter_quality_review.md",
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
  await writeText(path.join(intakeDir, "chapter_quality_review.md"), buildChapterQualityReview(packet, rawText));

  const nextPacket: AuthorInputPacket = {
    ...packet,
    status: "pending_confirmation",
    recommended_actions: [
      "review_fact_delta",
      "confirm_or_reject_vibe",
      "review_intention_hypotheses",
      "approve_or_reject_memory_patch",
      "review_chapter_quality",
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
  const units = proseUnits(rawText);
  const newFacts = concreteFactCandidates(units).slice(0, 6);
  const fallbackAnchor = meaningfulLines(rawText)[0];
  return {
    chapter,
    source: "human",
    new_facts: newFacts.length > 0
      ? newFacts
      : [fallbackAnchor ? `文本锚点（待人工判断是否为剧情事实）：${compactText(fallbackAnchor)}` : "未自动提取到足够具体的剧情事实，需人工补录。"],
    character_changes: buildCharacterChanges(packet, units),
    hooks_opened: buildHooksOpened(units),
    hooks_closed: buildHooksClosed(units),
    constraints_for_future: buildFactDeltaConstraints(rawText),
    source_refs: [{ file: packet.raw_source_path }],
  };
}

function concreteFactCandidates(units: string[]): string[] {
  return uniqueStrings(units.filter(isConcretePlotUnit).map((unit) => compactText(unit)));
}

function isConcretePlotUnit(unit: string): boolean {
  const clean = unit.trim();
  if (clean.length < 6) return false;
  if (/^(第[一二三四五六七八九十百\d]+[章节]|chapter\s*\d+|正文|设定|大纲)[:：]?/i.test(clean)) return false;
  const hasActor = /林砚|莱恩|艾琳娜|主角|男主|女主|他|她|我|少年|少女|老人|小女孩|男人|女人|骑士|神父|龙|黑钟|守卫|母亲|白手套/.test(clean);
  const hasAction = /醒|看|听|问|说|答|走|跑|逃|追|抓|按|推|挡|写|划|撬|拔|压|藏|救|杀|死|疼|痛|流血|熄灭|响|浮现|落|偏|回头|递|握|低头|抬头|笑|哭|吐|跪|打开|关上|发现|证明|承认|拒绝|选择|记住|忘|失去|破|裂|烧|亮|消失|出现|喝|补|咬|盯/.test(clean);
  const hasConcreteObject = /铜币|残页|黑钟|红纹|龙骨|手套|伞|门|锁|血|伤口|名字|债名|契约|法术|誊本|银盐|面包|木牌/.test(clean);
  return (hasActor && hasAction) || (hasConcreteObject && hasAction);
}

function buildCharacterChanges(packet: AuthorInputPacket, units: string[]): Record<string, string[]> {
  const changes: Record<string, string[]> = {};
  const characterMatchers: Array<[string, RegExp]> = [
    ["lin_yan", /林砚|莱恩/],
    ["ailinna", /艾琳娜/],
    ["protagonist", /主角|男主|我|他/],
    ["heroine", /女主|她/],
  ];

  for (const [key, matcher] of characterMatchers) {
    const matched = concreteFactCandidates(units.filter((unit) => matcher.test(unit))).slice(0, 4);
    if (matched.length > 0) changes[key] = matched;
  }

  if (packet.target_scope.entity && !changes[packet.target_scope.entity]) {
    const matched = concreteFactCandidates(units).slice(0, 3);
    if (matched.length > 0) changes[packet.target_scope.entity] = matched;
  }

  return changes;
}

function buildHooksOpened(units: string[]): string[] {
  const tailFirst = [...units.slice(-10), ...units.slice(0, -10)];
  const hookRules: Array<[string, RegExp]> = [
    ["身份/穿越错位钩子", /穿越|现代|手机|电脑|地球|名字|债名|旧名|莱恩|Lin Yan/],
    ["龙与法术长线钩子", /龙|龙骨|龙语|瓦尔卡洛斯|法术|契约/],
    ["教会/黑钟规则钩子", /教会|审判|神父|誊本|黑钟|银盐/],
    ["旧案证据钩子", /残页|旧案|白手套|证据|真相/],
    ["关系潜台词钩子", /别死|伞|偏了半寸|她没有回头|艾琳娜.*(?:看他|抓住|推|低头)|她.*(?:看他|抓住他的|推)/],
    ["生死压力钩子", /死|杀|血|伤|追|逃|活下来|疼|痛/],
  ];

  const hooks: string[] = [];
  for (const [label, matcher] of hookRules) {
    const evidence = tailFirst.find((unit) => matcher.test(unit));
    if (evidence) hooks.push(`${label}：${compactText(evidence)}`);
  }
  return uniqueStrings(hooks).slice(0, 6);
}

function buildHooksClosed(units: string[]): string[] {
  const closeRules: Array<[string, RegExp]> = [
    ["局部冲突暂时收束", /熄灭|退下|散开|停下|断开|结束|放过/],
    ["信息问题获得阶段答案", /露馅|真相|答案|说出|揭开|交代/],
    ["生存压力暂时解除", /救下|活下来|止血|脱身|逃出/],
  ];

  const closed: string[] = [];
  for (const [label, matcher] of closeRules) {
    const evidence = units.find((unit) => matcher.test(unit));
    if (evidence) closed.push(`${label}：${compactText(evidence)}`);
  }
  return uniqueStrings(closed).slice(0, 4);
}

function buildFactDeltaConstraints(rawText: string): string[] {
  const constraints = [
    "本文件是候选 fact_delta，不得直接写入 canon_registry.md。",
    "所有人物状态、伏笔和钩子需作者确认后才能进入长期记忆。",
  ];
  if (/能力|法术|龙语|契约|债名|黑钟|誊本|银盐/.test(rawText)) {
    constraints.push("法术、契约、债名或教会规则只按候选记录，需确认边界、代价和例外。");
  }
  if (/系统提示|系统面板|属性面板|任务奖励|面板|等级/.test(rawText)) {
    constraints.push("若保留系统/面板元素，需明确代价与限制，避免无代价外挂。");
  }
  return constraints;
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
  const units = proseUnits(rawText);
  const facts = concreteFactCandidates(units);
  const hooks = buildHooksOpened(units);
  const characterChanges = buildCharacterChanges(packet, units);
  return {
    patch_id: `patch_${packet.input_id}_001`,
    requires_human_approval: true,
    created_at: nowIso(),
    source_input: packet.input_id,
    updates: {
      timeline: {
        add_event: {
          chapter,
          event: facts[0] ?? "未自动提取到足够具体的剧情事件，需人工补录。",
        },
      },
      unresolved_hooks: {
        add: hooks.length > 0 ? hooks : ["未自动识别明确新钩子，需人工确认章末追问。"],
      },
      characters: Object.fromEntries(
        Object.entries(characterChanges).map(([entity, candidates]) => [entity, { candidates }]),
      ),
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

type QualityDecision = "pass" | "minor_revision" | "major_revision" | "rewrite";

interface QualityDimension {
  key: string;
  label: string;
  score: number;
  evidence: string[];
  fix: string;
}

function buildChapterQualityReview(packet: AuthorInputPacket, rawText: string): string {
  const chapter = packet.target_scope.chapter ?? "unknown_chapter";
  const lines = meaningfulLines(rawText);
  const firstLine = lines[0] ?? "";
  const firstWindow = lines.slice(0, 6).join(" ").slice(0, 800);
  const tail = lines.slice(-6).join(" ");
  const chapterText = lines.join("\n");
  const risks = collectTextSignals(chapterText, firstLine, tail);

  const dimensions = buildQualityDimensions(firstLine, firstWindow, tail, chapterText, risks);
  const hardGates = buildHardGates(dimensions, firstLine, firstWindow, tail, risks);
  const overallScore = roundScore(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length);
  const decision = decisionFor(overallScore, hardGates);
  const mustFix = revisionMustFix(dimensions, hardGates);
  const optional = dimensions
    .filter((item) => item.score < 4.2 && !mustFix.includes(item.fix))
    .slice(0, 3)
    .map((item) => item.fix);

  return `# Chapter Quality Review - ${packet.input_id}

review_type: chapter_quality_review
chapter: ${chapter}
source_input: ${packet.input_id}
generated_at: ${nowIso()}
rubric: novel-human-chapter-intake/references/chapter-quality-rubric.md
status: heuristic_review

## Summary

overall_score: ${overallScore.toFixed(2)}
decision: ${decision}

硬门槛：
${hardGates.length > 0 ? hardGates.map((item) => `- ${item}`).join("\n") : "- none"}

> 本报告是确定性启发式审稿，用于让 intake 自动产生可追踪质量检查；关键章节仍建议人工复核。

## Scorecard

| 维度 | 分数 | 证据 | 最小改法 |
| --- | ---: | --- | --- |
${dimensions.map((item) => `| ${item.label} | ${item.score.toFixed(1)} | ${item.evidence.map(quoteEvidence).join("<br>")} | ${item.fix} |`).join("\n")}

## Opening Audit

- first_sentence_hook: ${quoteEvidence(firstLine || "无有效正文首句")}
- first_300_to_800_chars: ${quoteEvidence(firstWindow || "无有效开头文本")}
- protagonist_focus: ${risks.protagonistAnchor ? "yes" : "weak_or_indirect"}

## Hook Ladder Audit

- opening_hook: ${risks.openingHook ? "present" : "weak"}
- chapter_end_hook: ${risks.chapterEndHook ? quoteEvidence(tail.slice(-160) || tail) : "weak_or_missing"}
- long_hook_candidates:
${longHookCandidates(chapterText).map((item) => `  - ${item}`).join("\n") || "  - none"}

## Reader Emotion Curve

- pressure: ${risks.pressure ? "present" : "weak"}
- curiosity: ${risks.curiosity ? "present" : "weak"}
- payoff: ${risks.payoff ? "present" : "weak"}
- aftertaste: ${risks.chapterEndHook ? "has_followup_question" : "flat"}

## Human Texture Audit

- effective_details:
${risks.humanTextureEvidence.map((item) => `  - ${quoteEvidence(item)}`).join("\n") || "  - none"}
- ai_flavor_risk_terms: ${risks.aiFlavorRiskCount}

## Revision Prescription

must_fix_now:
${mustFix.length > 0 ? mustFix.map((item) => `  - ${item}`).join("\n") : "  - none"}
optional:
${optional.length > 0 ? optional.map((item) => `  - ${item}`).join("\n") : "  - none"}

author_questions:
  - 本章最想让读者追问的问题是否就是当前章末钩子？
  - 主角本章的小胜和代价是否符合你的真实意图？
`;
}

function buildQualityDimensions(
  firstLine: string,
  firstWindow: string,
  tail: string,
  chapterText: string,
  risks: ReturnType<typeof collectTextSignals>,
): QualityDimension[] {
  return [
    {
      key: "protagonist_anchor",
      label: "主角锚定",
      score: score(risks.protagonistAnchor ? 4.5 : 3.4, risks.environmentOpening ? -0.4 : 0),
      evidence: [firstLine || "无有效正文首句"],
      fix: risks.protagonistAnchor ? "保持第一屏围绕主角压力、判断和行动。" : "把第一屏改为主角正在承受的具体压力或选择，世界信息从主角处境进入。",
    },
    {
      key: "opening_attraction",
      label: "开篇吸引力",
      score: score(risks.openingHook ? 4.4 : 3.3, risks.pressure ? 0.2 : 0),
      evidence: [firstLine || "无有效正文首句"],
      fix: risks.openingHook ? "保留开篇异常/危险，避免前置说明削弱冲击。" : "首段加入异常、危险、冲突、反差或具体问题，避免平铺环境。",
    },
    {
      key: "goal_pressure_action",
      label: "目标-压力-行动链",
      score: score(3.4, risks.pressure ? 0.3 : 0, risks.action ? 0.4 : 0, risks.goal ? 0.3 : 0),
      evidence: [firstWindow || firstLine],
      fix: risks.action ? "继续让主角用选择改变局面。" : "补出主角要什么、阻碍是什么、他主动做了什么。",
    },
    {
      key: "payoff",
      label: "爽点/情绪回报",
      score: score(3.3, risks.payoff ? 0.7 : 0, risks.cost ? 0.2 : 0),
      evidence: risks.payoffEvidence.length > 0 ? risks.payoffEvidence : [tail || firstWindow],
      fix: risks.payoff ? "保留局部回报，并确保它由主角行动触发。" : "给本章增加一次局部回报：规则突破、信息揭示、关系推进或压迫反转。",
    },
    {
      key: "hook_ladder",
      label: "钩子阶梯",
      score: score(3.5, risks.openingHook ? 0.3 : 0, risks.chapterEndHook ? 0.6 : 0),
      evidence: [tail || firstWindow],
      fix: risks.chapterEndHook ? "章末钩子可用，下一章需要回应具体问题。" : "把最后 3-5 行改成具体下一章期待，不用空泛预告。",
    },
    {
      key: "pacing_info_load",
      label: "信息投放与节奏",
      score: score(4.2, risks.infoLoadRisk ? -0.5 : 0, risks.paragraphUniformityRisk ? -0.2 : 0),
      evidence: [firstWindow || firstLine],
      fix: risks.infoLoadRisk ? "减少一次性术语解释，把设定压进冲突、后果和选择。" : "维持设定随行动进入，不要额外补设定集段落。",
    },
    {
      key: "human_texture",
      label: "人味与质感",
      score: score(3.5, Math.min(0.9, risks.humanTextureEvidence.length * 0.18)),
      evidence: risks.humanTextureEvidence.length > 0 ? risks.humanTextureEvidence.slice(0, 3) : [firstWindow || firstLine],
      fix: risks.humanTextureEvidence.length > 0 ? "保留服务人物的具体细节，避免堆无关素材。" : "补 1-2 个能暴露人物处境、习惯、恐惧或关系的具体细节。",
    },
    {
      key: "ai_flavor",
      label: "AI 味与文风风险",
      score: score(4.4, risks.aiFlavorRiskCount >= 4 ? -0.6 : 0, risks.aiFlavorRiskCount >= 8 ? -0.5 : 0),
      evidence: [`高风险词命中：${risks.aiFlavorRiskCount}`],
      fix: risks.aiFlavorRiskCount >= 4 ? "减少机械过渡和空泛形容词，用具体动作、物件和判断替代。" : "当前 AI 味风险可控，继续保持句式和段落重心变化。",
    },
    {
      key: "poison_risk",
      label: "毒点与信任",
      score: score(4.0, risks.cost ? 0.3 : -0.1, risks.systemPanelRisk ? -0.7 : 0),
      evidence: risks.costEvidence.length > 0 ? risks.costEvidence : [firstWindow || firstLine],
      fix: risks.cost ? "保留能力代价和边界，避免无代价外挂。" : "给主角的突破补出代价、失败风险或能力边界。",
    },
    {
      key: "serial_sustainability",
      label: "长篇可持续性",
      score: score(3.7, risks.curiosity ? 0.4 : 0, risks.chapterEndHook ? 0.3 : 0),
      evidence: longHookCandidates(chapterText).slice(0, 3),
      fix: risks.curiosity ? "保留长线问题，不要过早解释核心谜底。" : "补出一个可持续的关系、伏笔、债务或目标。",
    },
  ];
}

function collectTextSignals(chapterText: string, firstLine: string, tail: string) {
  const environmentOpeningSignal = isEnvironmentOpening(firstLine);
  const protagonistAnchor = /林砚|主角|他|她|我/.test(firstLine) && !environmentOpeningSignal;
  const openingHook = /刀|血|死|醒|追|逃|审判|失控|不能|没有|吐|痛|危险|杀|问|错|门锁|铜币|名字|债名|黑钟|龙/.test(firstLine);
  const pressure = /死|杀|刀|血|疼|痛|追|逃|审判|危险|失控|不能|必须|代价|忘|丢/.test(chapterText);
  const action = /写|划|挡|跑|逃|问|抓|按|推|救|证明|看|撬|拔|压|补|喝|藏/.test(chapterText);
  const goal = /要|想|必须|不能|证明|活|找|救|逃|知道|确认/.test(chapterText);
  const payoffEvidence = payoffEvidenceUnits(chapterText);
  const payoff = payoffEvidence.length > 0;
  const costTerms = chapterText.match(/代价|忘|失去|丢|疼|痛|伤|血|不能|风险|记忆|声音/g) ?? [];
  const cost = costTerms.length > 0;
  const chapterEndHook = isConcreteChapterEndHook(tail);
  const curiosity = /为什么|谁|名字|残页|旧案|债名|黑钟|龙|秘密|真相|不是/.test(chapterText);
  const infoLoadRisk = (chapterText.match(/世界|规则|契约|教会|龙语|债名|银盐|誊本|灰港|黑钟/g) ?? []).length > 36;
  const paragraphLengths = chapterText.split(/\n\s*\n/).map((paragraph) => paragraph.trim().length).filter(Boolean);
  const paragraphUniformityRisk = paragraphLengths.length > 8 && paragraphLengths.every((value) => value >= 40 && value <= 180);
  const humanTextureMatches = chapterText.match(/母亲|手机号|小名|面包|鞋|老人|小女孩|栗子|木牌|手套|语音|文档|电|门禁|汗|血|舌尖|指甲|早餐|旧伤|斗篷|鱼骨|铜币|伞|袖口|掌心|牙齿|伤口|灰|雨水|油灯/g) ?? [];
  const humanTextureEvidence = evidenceForKeywords(chapterText, humanTextureMatches.slice(0, 5));
  const aiFlavorRiskCount = (chapterText.match(/然而|仿佛|某种|显得|由此可见|总的来说|古老|神秘|宏伟/g) ?? []).length;
  const systemPanelRisk = /系统提示|系统面板|属性面板|任务奖励|面板|等级/.test(chapterText);
  const costEvidence = evidenceForKeywords(chapterText, costTerms.slice(0, 4));
  return {
    protagonistAnchor,
    environmentOpening: environmentOpeningSignal,
    openingHook,
    pressure,
    action,
    goal,
    payoff,
    payoffEvidence,
    cost,
    costEvidence,
    chapterEndHook,
    curiosity,
    infoLoadRisk,
    paragraphUniformityRisk,
    humanTextureEvidence,
    aiFlavorRiskCount,
    systemPanelRisk,
  };
}

function payoffEvidenceUnits(chapterText: string): string[] {
  const units = proseUnits(chapterText);
  const usable = units.filter((unit) => !/是否承认|有资格不承认|不承认|不是来救|证明流程本身会炸/.test(unit));
  const outcomePayoff = usable.filter((unit) => {
    return /救下|救了|救回|救他|救她|活下来|断开|脱身|止血|退下|熄灭|破局|识破|露馅|揭开|反噬|反转|小胜|压住/.test(unit);
  });
  const informationPayoff = usable.filter((unit) => {
    return /发现.*(?:真相|证据|名字|线索)|指向.*(?:真相|证据|名字|线索)|证明.*(?:错误|身份|清白)/.test(unit);
  });
  return uniqueStrings([...outcomePayoff, ...informationPayoff].map((unit) => compactText(unit))).slice(0, 4);
}

function isConcreteChapterEndHook(tail: string): boolean {
  const clean = tail.trim();
  if (!clean) return false;
  if (/更大的危机即将来临|一切才刚刚开始|命运的齿轮/.test(clean)) return false;
  return /[？?]|别死|死|杀|响|声音|浮现|回答|等|呼吸|名字|债名|钟|黑钟|龙|红纹|残页|旧案|低下头|安静|门|锁|谁|不是/.test(clean);
}

function isEnvironmentOpening(line: string): boolean {
  return /^(灰港|旧|抄写|城|夜|天|雨|风|雾|世界|大陆|王朝|山|海|库房|礼拜堂)/.test(line.trim());
}

function buildHardGates(
  dimensions: QualityDimension[],
  firstLine: string,
  firstWindow: string,
  tail: string,
  risks: ReturnType<typeof collectTextSignals>,
): string[] {
  const gates: string[] = [];
  if (!risks.protagonistAnchor && risks.environmentOpening) {
    gates.push("开头主要从环境/地点进入，主角锚定偏弱。");
  }
  if (!risks.curiosity) {
    gates.push("本章缺少明确读者问题。");
  }
  if (!risks.action) {
    gates.push("主角行动链偏弱。");
  }
  if (!risks.chapterEndHook) {
    gates.push("章末钩子偏弱。");
  }
  if (risks.infoLoadRisk && firstWindow.length > 600) {
    gates.push("设定名词密度偏高，有设定集开篇风险。");
  }
  if (dimensions.some((item) => item.score < 3)) {
    gates.push("存在低于 3 分的核心维度。");
  }
  void firstLine;
  void tail;
  return gates;
}

function decisionFor(scoreValue: number, hardGates: string[]): QualityDecision {
  if (scoreValue < 3 || hardGates.length >= 2) return "rewrite";
  if (scoreValue < 3.6 || hardGates.length === 1) return "major_revision";
  if (scoreValue < 4) return "minor_revision";
  return "pass";
}

function revisionMustFix(dimensions: QualityDimension[], hardGates: string[]): string[] {
  if (hardGates.length > 0) return hardGates.slice(0, 3);
  return dimensions
    .filter((item) => item.score < 3.8)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => item.fix);
}

function longHookCandidates(chapterText: string): string[] {
  const keywords = ["名字", "债名", "残页", "黑钟", "龙", "旧案", "红纹", "教会", "艾琳娜", "记忆"];
  const found = keywords.filter((keyword) => chapterText.includes(keyword));
  return found.map((keyword) => `${keyword} 相关长线问题`);
}

function evidenceForKeywords(chapterText: string, keywords: string[]): string[] {
  const unique = [...new Set(keywords)].slice(0, 4);
  const lines = proseUnits(chapterText);
  return unique
    .map((keyword) => lines.find((line) => line.includes(keyword)))
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index);
}

function score(base: number, ...deltas: number[]): number {
  return roundScore(Math.max(1, Math.min(5, base + deltas.reduce((sum, value) => sum + value, 0))));
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
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

function proseUnits(rawText: string): string[] {
  return meaningfulLines(rawText)
    .flatMap(splitLineIntoUnits)
    .map((unit) => unit.trim())
    .filter((unit) => unit.length > 0);
}

function splitLineIntoUnits(line: string): string[] {
  const chars = Array.from(line);
  const units: string[] = [];
  let buffer = "";
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    buffer += char;
    if ("。！？!?；;".includes(char)) {
      const next = chars[index + 1];
      if (next && "”\"’'」』".includes(next)) {
        buffer += next;
        index += 1;
      }
      units.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim()) units.push(buffer.trim());
  return units;
}

function evidenceLines(rawText: string): string[] {
  const lines = meaningfulLines(rawText);
  return lines.length > 0 ? lines.slice(0, 4) : [rawText.trim().slice(0, 160)];
}

function quoteEvidence(value: string): string {
  const clean = compactText(value, 160);
  if (!clean) return "（无可用原文证据）";
  if ((clean.startsWith("“") && clean.endsWith("”")) || (clean.startsWith("\"") && clean.endsWith("\""))) {
    return clean;
  }
  return `“${clean}”`;
}

function compactText(value: string, maxLength = 180): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function uniqueStrings(values: string[]): string[] {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}
