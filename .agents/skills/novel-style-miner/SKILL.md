---
name: novel-style-miner
description: 中文网文文风候选提取与文本质感审稿技能。用于从作者正文、修改痕迹、文风反馈、AI 稿反馈、读者反馈中提取节奏、句式、对白、情绪表达、爽点写法、人味细节、AI 味规避等候选规则；当用户要求判断文字是否有质感、是否像 AI、是否抓人时，按章节质量 Rubric 提取可执行风格候选；不直接写 style_bible。
---

# 文风候选提取

## 职责

提取“可能的文风规则”，不是给作者贴风格标签。

## 必读

- 作者原文或修改前后文本。
- `40_style/style_candidates.md`、`anti_style.md`、`aspirational_style.md`。
- 相关反馈输入。
- 需要评估人味、AI 味、开头吸引或章节质感时读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。

## 工作流程

1. 从具体文本证据出发。
2. 区分稳定风格、阶段性尝试、明确不要、想靠近的方向。
3. 关注中文网文可执行层面：追读节奏、章末钩子、对白克制、爽点密度、AI 味。
4. 把“质感/人味”拆成可执行观察：细节是否塑造人物、句式是否有速度变化、对白是否有潜台词、描写是否服务冲突。
5. 输出 candidate only，等待 文风演化 或 周期对齐 确认。

## 输出

输出 style 候选：

- `observation`
- `evidence`
- `applies_to`
- `risk_if_overused`
- `quality_dimension`：如 human_texture、ai_flavor、hook_ladder、pacing_info_load。
- `suggested_next_test`：下一章可验证的具体写法。
- `status: candidate_only`
- `needs_confirmation`

## 禁止

- 不写 `style_bible.md`。
- 不把一章偶然写法固化成长期规则。
- 不要求作者模仿某作品句式。

## 自检

- 是否有原文证据？
- 是否能指导下一章写作？
- 是否把“人味/AI 味”落成具体句式、细节或节奏问题？
- 是否指出过度使用风险？
- 是否符合中文连载语境？
