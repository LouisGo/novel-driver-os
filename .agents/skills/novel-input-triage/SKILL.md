---
name: novel-input-triage
description: Triage / 输入分流；用于作者随手灵感、题材卖点、爽点、节奏、粘贴片段、混合意图、审稿请求、投喂样本、废案或反馈，识别 detected_type、detected_intents、authority、scope 和确认需求；不封包、不路由、不写正文或正史。
---

# 中文网文输入分流

## 职责

识别一段作者输入“是什么”，而不是决定它“应该成为什么”。输出分流判断，供 作者输入包 和 Routing 使用。

## 必读

- 原始输入全文。
- 若在项目内：`project.yaml`、`00_inbox/triaged/` 近似输入、`10_bible/open_questions.md`。
- `../_shared/commercial-storycraft-protocol.md`。
- `../_shared/canon-safety-protocol.md`。
- 不需要读取全书正文。

## 分流维度

- 输入类型必须覆盖 CLI `InputType`：`inspiration`、`chapter`、`fragment`、`book_profile`、`outline`、`setting`、`character`、`worldbuilding`、`ambiguity`、`style_feedback`、`learning_sample`、`discarded_idea`、`rewrite_request`、`chapter_variant`、`feedback`、`unknown`。
- 任务意图：`ingest_only`、`route_only`、`premise_design`、`payoff_design`、`emotion_curve_design`、`chapter_brief_design`、`chapter_quality_review`、`opening_review`、`style_review`、`canon_review`、`alignment_review`。
- 权威等级：L0 暂存、L1 候选、L2 作者批注、L3 明确指令、L4 作者正文、L5 作者确认正稿、L6 已发布正文。
- 目标范围：项目、卷、章节、人物、势力、地点、物件、关系线、文风、留白。
- 风险：是否可能污染正史、是否需要即时确认、是否只应短期保留。

## 工作流程

1. 保留原文语气，不改写作者输入。
2. 先读显式标签，再读正文语义；标签和语义冲突时标记冲突，不擅自覆盖。
3. 允许一个输入命中多个意图，主类型写入 `detected_type`，完整列表写入 `detected_intents`。
4. 对大纲类输入识别卷级范围，不要因正文中出现 `ch0001` 就降级成单章输入。
5. 对 `#不要入库`、`暂存`、`先别记` 直接标为 L0，并建议 raw only。

## 输出

输出 `triage_report`，包含：

- `detected_type`
- `detected_intents`
- `authority_level`
- `target_scope`
- `confidence`
- `requires_confirmation`
- `recommended_next_skill`
- `task_intent`：triage-only，不是 `AuthorInputPacket` 字段。
- `risk_notes`
- `evidence`

## 禁止

- 不生成正文。
- 不写 `canon_registry.md`、`style_bible.md`、`human_final.md`、`final.md`。
- 不把“看起来合理”的推断当成作者意图。

## 中文网文检查

分流时特别识别：人设、题材炼金、套路包装、新意、爽点、毒点、情绪曲线、节奏缓冲、追读、章末钩子、伏笔、留白、CP 线、圆场、AI 味、掉书袋、工业化、读者反馈、废案复活、优秀样本学习、开篇是否抓人、是否围绕主角、是否有人味。

对“这是我觉得写得好的样本”“学习这段”“消化这个开头/章末/爽点/对白”类输入，标为 `learning_sample`，推荐 `novel-exemplar-learning`。样本只能提炼技法，不进入正史。

对“这个题材有没有新意”“套路怎么包装”“爽点是不是自嗨”“大战后怎么缓一缓”“情绪曲线怎么设计”“不要掉书袋/不要工业化”类输入，保留原始 `detected_type`，并在 `detected_intents` 中加入 `premise_design`、`payoff_design`、`emotion_curve_design` 或 `style_review`。

## 自检

- 是否保留了原文证据？
- `detected_type` 是否属于当前 CLI `InputType`？
- 多意图是否完整进入 `detected_intents`，没有被单一路由吞掉？
- 是否明确下一步需要哪个技能？
- 是否标记了需要作者确认的项？
