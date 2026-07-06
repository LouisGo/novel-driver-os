---
name: novel-human-chapter-intake
description: 中文网文人工章节接入与章节质量审稿技能。用于接住作者亲写正文、章节正稿或正文片段，提取事实变化、人物状态、物件、伏笔、章末钩子、追读风险和潜在冲突；当用户要求判断是否好看、是否有吸引力、是否有人味/AI味、开头是否抓人或章节是否该打回时，按中文网文章节质量 Rubric 输出可执行审稿报告；不润色、不改写、不直接写入正史。
---

# 人工章节接入

## 职责

作者先写，系统后接。只做接入、提取、提醒和候选，不重写正文。

## 必读

- 作者输入包。
- 原始正文。
- `10_bible/canon_registry.md`、`intentional_ambiguity.md`、`open_questions.md`。
- 相关人物、势力、地点、物件文件。
- 需要输出格式时读 `references/intake-output.md`。
- 需要判断章节是否好看、是否抓人、是否该打回时读 `references/chapter-quality-rubric.md`。

## 工作流程

1. 保留正文原貌，不做润色。
2. 抽取真实剧情事实，不输出“作者提交了正文”这种空事实。
3. 分离事实、氛围、意图、冲突、文风候选。
4. 识别中文网文层面的追读点、毒点、章末钩子、爽点承诺。
5. 如进行质量审稿，按 Rubric 评分：主角锚定、开篇吸引、目标压力行动链、爽点、钩子阶梯、信息投放、人味、AI 味、毒点、长篇可持续性。
6. 所有推断标注 confidence 和是否需要确认。

## 输出

至少生成接入报告或接入胶囊输入草案。字段与 `references/intake-output.md` 保持一致：

- `chapter`
- `source_input`
- `new_facts`
- `entity_delta`
- `object_delta`
- `hooks_opened`
- `hooks_closed`
- `continuity_notes`
- `style_observations`
- `reader_risks`
- `chapter_quality_review`：可选；包含 overall_score、decision、hard_gates、scorecard、revision_prescription。
- `alignment_questions`
- `source_refs`

## 禁止

- 不改正文。
- 不直接覆盖 `human_final.md` 或 `final.md`。
- 不把 AI 推断写入 `canon_registry.md`。

## 自检

- 新事实是否具体到人物、行为、地点、物件？
- 是否保留原文证据句？
- 如给分，是否每个扣分项都有原文证据和最小改法？
- 是否指出“下一步作者要确认什么”？
- 是否避免泛文学评论？
