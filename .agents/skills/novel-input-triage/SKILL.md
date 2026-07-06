---
name: novel-input-triage
description: 中文网文输入分流技能。用于处理作者随手灵感、正文片段、章节正稿、人设、世界观、设定、大纲、留白、文风反馈、废案、读者反馈、AI 稿反馈或“帮我审稿/看开头/看吸引力/看 AI 味/看钩子”的质量评估请求，识别输入类型、权威等级、目标范围和确认需求；不用于生成正文或写入正史。
---

# 中文网文输入分流

## 职责

识别一段作者输入“是什么”，而不是决定它“应该成为什么”。输出分流判断，供 作者输入包 和 Routing 使用。

## 必读

- 原始输入全文。
- 若在项目内：`project.yaml`、`00_inbox/triaged/` 近似输入、`10_bible/open_questions.md`。
- 不需要读取全书正文。

## 分流维度

- 输入类型：`inspiration`、`chapter`、`fragment`、`setting`、`character`、`worldbuilding`、`outline`、`ambiguity`、`style_feedback`、`discarded_idea`、`feedback`、`unknown`。
- 任务意图：`ingest_only`、`route_only`、`chapter_quality_review`、`opening_review`、`style_review`、`canon_review`、`alignment_review`。
- 权威等级：L0 暂存、L1 候选、L2 作者批注、L3 明确指令、L4 作者正文、L5 作者确认正稿、L6 已发布正文。
- 目标范围：项目、卷、章节、人物、势力、地点、物件、关系线、文风、留白。
- 风险：是否可能污染正史、是否需要即时确认、是否只应短期保留。

## 工作流程

1. 保留原文语气，不改写作者输入。
2. 先读显式标签，再读正文语义；标签和语义冲突时标记冲突，不擅自覆盖。
3. 允许一个输入命中多个目标，例如同时包含主角、女主和关系线。
4. 对大纲类输入识别卷级范围，不要因正文中出现 `ch0001` 就降级成单章输入。
5. 对 `#不要入库`、`暂存`、`先别记` 直接标为 L0，并建议 raw only。

## 输出

输出 `triage_report`，包含：

- `detected_types`
- `authority_level`
- `target_scope`
- `confidence`
- `requires_confirmation`
- `recommended_next_skill`
- `task_intent`
- `risk_notes`
- `evidence`

## 禁止

- 不生成正文。
- 不写 `canon_registry.md`、`style_bible.md`、`human_final.md`、`final.md`。
- 不把“看起来合理”的推断当成作者意图。

## 中文网文检查

分流时特别识别：人设、爽点、毒点、追读、章末钩子、伏笔、留白、CP 线、圆场、AI 味、读者反馈、废案复活、开篇是否抓人、是否围绕主角、是否有人味。

## 自检

- 是否保留了原文证据？
- 是否把事实、氛围、意图分开？
- 是否明确下一步需要哪个技能？
- 是否标记了需要作者确认的项？
