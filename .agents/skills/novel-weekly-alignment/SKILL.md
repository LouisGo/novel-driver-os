---
name: novel-weekly-alignment
description: Weekly Alignment / 周期作者对齐；用于每周、每 10 章、阶段回顾或反复反馈后，压缩系统误解、质量趋势、文风偏移和下步策略为 decisions_needed、blocked_by 和可执行 next_commands。
---

# 周期作者对齐

## 职责

不是写周报，而是校准系统理解和下周创作策略。

## 必读

- 作者输入包s。
- `01_intake/*/intention_hypotheses.yaml`、tentative vibes。
- `10_bible/open_questions.md`。
- `40_style/style_candidates.md`、`anti_style.md`。
- `70_debt/retcon_debt.yaml`。
- 近期 `chapter_quality_review` 或 `01_intake/*/` 审稿结果；必要时读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 汇总输入类型和高权威输入。
2. 只列最重要的 3-5 个不确定项。
3. 找深层矛盾：人物欲望、世界观代价、关系线方向。
4. 汇总章节质量趋势：主角锚定、钩子、爽点、人味、AI 味、毒点是否反复失分。
5. 给作者提供少量中文网文策略选项。
6. 输出不会修改正史的 对齐报告。

## 输出

报告包含：

- 本周输入回顾
- 系统不确定的问题
- 需要作者确认的关键项
- 文风偏移观察
- 章节质量趋势：最高风险 3 项、连续失分项、下周必须改的 1 项。
- 下周策略建议
- `decisions_needed`
- `blocked_by`
- `recommended_next_commands`
- `style_or_canon_candidates`

## 禁止

- 不把报告变成长篇流水账。
- 不自动确认 pending 项。
- 不把“多给粗稿”默认当最佳策略。

## 自检

- 是否压缩到作者能决策？
- 是否指出系统可能误解哪里？
- 是否覆盖 AI 味、爽点、毒点和追读？
- 是否把审稿结论压缩成作者能执行的一两个选择？
- `recommended_next_commands` 是否能接回 CLI loop，或 `blocked_by` 是否明确？
- 是否给出下周可执行策略？
