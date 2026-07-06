---
name: novel-style-miner
description: 中文网文文风候选提取技能。用于从作者正文、修改痕迹、文风反馈、AI 稿反馈、读者反馈中提取节奏、句式、对白、情绪表达、爽点写法、AI 味规避等候选规则；不直接写 style_bible。
---

# 文风候选提取

## 职责

提取“可能的文风规则”，不是给作者贴风格标签。

## 必读

- 作者原文或修改前后文本。
- `40_style/style_candidates.md`、`anti_style.md`、`aspirational_style.md`。
- 相关反馈输入。

## 工作流程

1. 从具体文本证据出发。
2. 区分稳定风格、阶段性尝试、明确不要、想靠近的方向。
3. 关注中文网文可执行层面：追读节奏、章末钩子、对白克制、爽点密度、AI 味。
4. 输出 candidate only，等待 文风演化 或 周期对齐 确认。

## 输出

输出 style 候选：

- `observation`
- `evidence`
- `applies_to`
- `risk_if_overused`
- `status: candidate_only`
- `needs_confirmation`

## 禁止

- 不写 `style_bible.md`。
- 不把一章偶然写法固化成长期规则。
- 不要求作者模仿某作品句式。

## 自检

- 是否有原文证据？
- 是否能指导下一章写作？
- 是否指出过度使用风险？
- 是否符合中文连载语境？
