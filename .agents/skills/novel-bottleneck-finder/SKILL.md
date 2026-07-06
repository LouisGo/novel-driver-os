---
name: novel-bottleneck-finder
description: Bottleneck Diagnosis / 创作瓶颈诊断；用于卡文、审稿打回、爽点弱、钩子弱、人味不足、AI 味、毒点或反馈混乱时定位唯一主瓶颈，输出证据、pass/fail gate、blocked_by 和最小 next_command。
---

# 创作瓶颈诊断

## 职责

诊断“为什么写不动/不敢推进/反馈混乱”，不是直接给一堆写作建议。

## 必读

- 用户描述的卡点。
- 近期 `80_context/`、`60_alignment/`、`70_debt/`。
- 相关开放问题、文风候选、正史检查报告。
- 如卡点来自正文质量或审稿打回，读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。
- `../_shared/commercial-storycraft-protocol.md`。
- `../_shared/canon-safety-protocol.md`。

## 瓶颈类型

- 设定边界不清。
- 题材卖点陈旧或只有套路没有炼金。
- 人物欲望不清。
- 主角锚定失效。
- 关系线过热或过冷。
- 开篇吸引力不足。
- 爽点承诺不足。
- 爽点自嗨或不符合人性回报。
- 情绪曲线失衡：持续高潮、持续受挫或持续平路。
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
4. 给最小下一步：题材炼金、爽点架构、情绪曲线、章节 brief、对齐问题、补丁、审稿、手写关键段、暂停自动档。
5. 标记是否需要作者亲自介入。
6. 如果无法推进，写 `blocked_by`，不要输出泛化建议。

## 输出

输出 瓶颈诊断报告：

- `primary_bottleneck`
- `secondary_risks`
- `evidence`
- `rubric_dimension`：如 protagonist_anchor、hook_ladder、ai_flavor。
- `recommended_next_skill`
- `minimal_next_action`
- `next_command`
- `blocked_by`
- `pass_fail_gate`
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
- 是否给出一个最小可执行 `next_command`，或明确 `blocked_by`？
- 是否能推动下一步行动？
- 是否符合中文网文连载压力？
