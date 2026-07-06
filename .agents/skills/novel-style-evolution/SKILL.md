---
name: novel-style-evolution
description: Style Evolution / 文风演化；用于把重复 style_candidates、作者反馈或章节质量趋势整理成 confirmed rule proposals、aspirational、anti-style 和 entropy budget 候选；不直接编辑 style_bible。
---

# 文风演化管理

## 职责

让系统服务“作者想成为的作者”，而不是冻结当前文风。

## 必读

- `40_style/` 全部核心文件。
- `style_candidates.md` 和近期 周期对齐。
- 需要文件职责时读 `references/style-system.md`。
- 需要把章节审稿问题转成风格规则时读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。
- `../_shared/commercial-storycraft-protocol.md`。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 收集 文风候选，不直接确认。
2. 区分 confirmed rule proposals、aspirational candidates、anti-style candidates、entropy budget notes。
3. 把读者反馈、AI 味、掉书袋、工业化风险转成可执行风格约束。
4. 只有当同类问题在多章或多次反馈中重复出现，才把审稿结论提升为长期风格候选。
5. 对每条新增 confirmed rule 要求作者确认来源。

## 输出

输出 文风演化提案：

- `confirmed_rule_proposals`
- `aspirational_candidates`
- `anti_style_candidates`
- `entropy_budget_notes`
- `quality_rubric_candidates`：从章节审稿中提炼的长期规则候选。
- `anti_industrial_candidates`：理论外露、设定堆砌、功能化人物、机械情绪曲线等反风格候选。
- `author_questions`
- `next_commands`

每条规则候选必须包含：

- `applies_to`
- `evidence`
- `risk_if_overused`
- `status: candidate_only | author_confirmed_pending_apply`
- `needs_author_confirmation`

## 禁止

- 不直接覆盖 `style_bible.md`。
- 不把“更像某作品”写成模仿句式。
- 不把文风锁死到单一调性。
- 不把通用创作理论写成正文口吻。

## 自检

- 是否保护风格实验空间？
- 是否区分“现在”和“想靠近”？
- 是否列出 anti-style？
- 是否列出反工业化规则，且每条都有文本证据？
- 是否区分“一章问题”和“长期风格规则”？
- 所有 output 是否仍是 proposal/candidate，没有直接写 `style_bible.md`？
- 是否给作者确认入口？
