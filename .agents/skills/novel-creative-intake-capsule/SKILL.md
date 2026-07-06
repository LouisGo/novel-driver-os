---
name: novel-creative-intake-capsule
description: Creative Intake Capsule / 创作接入胶囊；用于 human chapter intake 已完成后，组装 fact_delta、氛围、意图、冲突、style_candidates、memory_patch 和审稿产物；不跳过事实提取、不 apply 正史。
disable-model-invocation: true
---

# 创作接入胶囊

## 职责

把一次重要创作输入拆成多层候选文件包，让长期记忆可以审查、确认和回滚。

## 必读

- `01_intake/<inputId>/` 已有文件，如存在。
- 作者输入包 和原始输入。
- `references/capsule-protocol.md`。
- 需要章节质量审稿时读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。
- `10_bible/`、相关 `20_entities/`、`30_plot/`、`40_style/`。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 先确认 `novel-human-chapter-intake` 已产出稳定事实提取；没有则输出 `blocked_by: missing_human_chapter_intake`。
2. 生成十个文件的内容草案，缺项必须说明原因。
3. 三种氛围假设必须互相区分，不能同义换词。
4. 如输入是正文正稿，补充 `chapter_quality_review.md` 草案；只审稿，不改正文。
5. 意图假设分 L1/L2/L3；L2 和 L3 必须有限 TTL。
6. 记忆补丁 只写 提案，等待作者确认。

## 输出

输出完整 capsule proposal：

- `fact_delta.yaml`
- `atmosphere_triads.md`
- `confirmed_vibes.md`
- `tentative_vibes.md`
- `intention_hypotheses.yaml`
- `conflict_footnotes.md`
- `retcon_debt_update.yaml`
- `style_candidates.md`
- `memory_patch.yaml`
- `alignment_questions.md`
- `chapter_quality_review.md`：可选；当用户要求审稿或输入为章节正稿时生成。

## 禁止

- 不直接写正史。
- 不把 tentative vibe 写入长期记忆。
- 不把 L3 弱猜测写入 decision log。

## 自检

- 十个必备文件是否齐全；缺项是否有明确 `blocked_by` 或 `not_applicable_reason`？
- 每个判断是否有证据？
- 质量审稿是否给出分数、硬门槛和最小改法？
- 是否保护留白？
- `memory_patch.yaml` 是否设置 `requires_human_approval: true`？
- 是否明确需要作者确认的最少问题，且不超过 3 个？
