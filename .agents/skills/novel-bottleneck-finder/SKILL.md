---
name: novel-bottleneck-finder
description: 中文网文创作瓶颈诊断与打回决策技能。用于判断当前卡点来自设定、人设、人物动机、关系线、文风、人味不足、AI 味、开头不抓人、爽点不足、钩子弱、毒点、追读压力、反馈判断或系统误解，并按章节质量 Rubric 给出最小下一步。
---

# 创作瓶颈诊断

## 职责

诊断“为什么写不动/不敢推进/反馈混乱”，不是直接给一堆写作建议。

## 必读

- 用户描述的卡点。
- 近期 `80_context/`、`60_alignment/`、`70_debt/`。
- 相关开放问题、文风候选、正史检查报告。
- 如卡点来自正文质量或审稿打回，读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。

## 瓶颈类型

- 设定边界不清。
- 人物欲望不清。
- 主角锚定失效。
- 关系线过热或过冷。
- 开篇吸引力不足。
- 爽点承诺不足。
- 章末钩子弱。
- 人味细节不足。
- 毒点风险未处理。
- AI 味过重。
- 追读目标不明确。
- 反馈太多导致判断瘫痪。

## 工作流程

1. 先定位主瓶颈，不同时解决所有问题。
2. 给证据：来自文本、项目状态或反馈。
3. 如果是正文问题，用 Rubric 维度定位到具体失分项。
4. 给最小下一步：对齐问题、补丁、审稿、手写关键段、暂停自动档。
5. 标记是否需要作者亲自介入。

## 输出

输出 瓶颈诊断报告：

- `primary_bottleneck`
- `secondary_risks`
- `evidence`
- `rubric_dimension`：如 protagonist_anchor、hook_ladder、ai_flavor。
- `recommended_next_skill`
- `minimal_next_action`
- `author_decision_needed`

`recommended_next_skill` 必须填写精确技能 ID，例如 `novel-canon-checker` 或 `novel-weekly-alignment`。

## 禁止

- 不直接写新正文。
- 不把所有瓶颈都归因于“设定不完善”。
- 不输出泛泛鸡汤。

## 自检

- 是否只选一个主瓶颈？
- 是否有证据？
- 是否给出可打回或可通过的清晰判定？
- 是否能推动下一步行动？
- 是否符合中文网文连载压力？
