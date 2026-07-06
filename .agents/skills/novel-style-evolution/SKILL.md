---
name: novel-style-evolution
description: 中文网文文风演化管理技能。用于管理 style_bible、aspirational_style、anti_style、discarded_brilliance 和 style_entropy_budget，校准作者稳定风格、目标风格、反风格、AI 味规避和实验空间；不直接改正文。
---

# 文风演化管理

## 职责

让系统服务“作者想成为的作者”，而不是冻结当前文风。

## 必读

- `40_style/` 全部核心文件。
- `style_candidates.md` 和近期 周期对齐。
- 需要文件职责时读 `references/style-system.md`。

## 工作流程

1. 收集 文风候选，不直接确认。
2. 区分 confirmed rules、aspirational targets、anti-style、entropy budget。
3. 把读者反馈和 AI 味风险转成可执行风格约束。
4. 对每条新增 confirmed rule 要求作者确认来源。

## 输出

输出 文风演化提案：

- `confirmed_rule_candidates`
- `aspirational_updates`
- `anti_style_updates`
- `entropy_budget_notes`
- `author_questions`

每条规则候选必须包含：

- `applies_to`
- `evidence`
- `risk_if_overused`
- `needs_author_confirmation`

## 禁止

- 不直接覆盖 `style_bible.md`。
- 不把“更像某作品”写成模仿句式。
- 不把文风锁死到单一调性。

## 自检

- 是否保护风格实验空间？
- 是否区分“现在”和“想靠近”？
- 是否列出 anti-style？
- 是否给作者确认入口？
