---
name: novel-exemplar-learning
description: 中文网文优秀样本投喂、学习与技法消化技能。用于作者提供自己觉得写得好的网文章节、段落、开头、章末、爽点、对白、氛围片段或竞品样本时，提炼可迁移的叙事技法、节奏结构、读者情绪机制和反 AI 味经验；严禁复刻原文、人物、设定、句式和桥段，不把样本内容写入正史。
---

# 优秀样本学习

## 职责

把“我觉得这段写得好”的外部样本，消化为可迁移技法，而不是模仿文本。

## 必读

- 样本文本全文或片段。
- 作者说明：为什么觉得好、想学哪一层。
- 当前项目 `project.yaml`、`10_bible/book_profile.yaml`、`40_style/aspirational_style.md`、`anti_style.md`、`style_entropy_budget.md`。
- 如样本用于改某章：相关章节 intake、review 或 context packet。

## 分析维度

- 读者情绪机制：压迫、期待、爽点、悬疑、人味、暧昧、危险、余味。
- 结构技法：开头钩子、信息延迟、冲突推进、章末追问、反转阶梯。
- 句段节奏：短句密度、动作/对白比例、段落长度、停顿位置。
- 人物质感：选择、代价、微动作、潜台词、关系张力。
- 设定投放：通过冲突暴露规则，而不是说明书。
- 商业功能：追读、订阅冲动、卷目标承诺、爽点兑现。

## 输出

输出 `learning_digest`，字段：

- `source_label`
- `sample_scope`：opening / chapter_end / dialogue / payoff / atmosphere / full_chapter / other
- `what_works`
- `evidence_refs`：短证据，不大段引用。
- `transferable_techniques`
- `non_transferable_elements`：不能学的角色、设定、桥段、专有名词、原句。
- `risk_if_copied`
- `project_fit`：适合当前项目的部分。
- `practice_tasks`：1-3 个可验证练习。
- `candidate_style_updates`：只作为候选。
- `status: learning_only`
- `requires_author_confirmation`

## 禁止

- 不复写、仿写或改写样本文本。
- 不输出样本的长段原文。
- 不把样本人物、设定、势力、地名、专有名词、桥段写进当前项目。
- 不把“像某作品”写成目标规则。
- 不直接写 `style_bible.md`、`canon_registry.md` 或章节正文。

## 与其他技能衔接

- 需要固化为风格候选 -> `novel-style-evolution`。
- 需要用于下一章写作 -> `novel-learning-transfer`。
- 样本触发毒点/爽点判断 -> `novel-bottleneck-finder` 或 `novel-human-chapter-intake` Rubric。
- 样本与当前正史冲突 -> `novel-canon-checker`。

## 自检

- 是否只提炼技法，而不是借用内容？
- 是否写清哪些东西不能迁移？
- 是否能指导下一章的具体写法？
- 是否有作者确认入口？
- 是否保留学习价值但避免抄袭风险？

