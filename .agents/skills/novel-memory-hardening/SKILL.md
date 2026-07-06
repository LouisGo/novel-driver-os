---
name: novel-memory-hardening
description: 中文网文完结卷记忆硬化技能。用于将已完成卷压缩为长期可用记忆，包括卷摘要、正史变化、人物演化、关系演化、名场面、氛围摘要和怪诞细节；不删除源文件。
---

# 完结卷记忆硬化

## 职责

把完结卷从热层/温层沉淀为冷层记忆，同时保留未来可能复活的人类气味。

## 必读

- 目标卷 温层/冷层 文件。
- `10_bible/`、`20_entities/`、`30_plot/`、已确认 vibes。
- 输出模板详见 `references/hardening-output.md`。

## 工作流程

1. 先确定卷范围和 来源引用。
2. 分别提炼事实、人物、关系、氛围、名场面。
3. 单独保存 unstructured oddities。
4. 所有正史变化都标明是否已确认。

## 硬化闸门

- 只有作者明确标记完结卷，或项目中存在足够的温层/冷层卷级材料时，才输出正式硬化提案。
- 如果卷未完结或材料不足，输出 `partial_hardening_report`，列出缺失材料和下一步收集项。
- 不允许 `Pending manual selection`、`MVP placeholder`、`No source snippets found` 作为通过结果。

## 输出

输出 硬化提案：

- `volume_epic_summary.md`
- `canon_changes.md`
- `character_evolution.md`
- `relationship_evolution.md`
- `top_5_anchor_scenes.md`
- `atmosphere_digest.md`
- `unstructured_oddities.md`

## 禁止

- 不删除源文件。
- 不把未确认候选写成 confirmed canon。
- 不把怪诞细节当无用噪声删掉。

## 自检

- 是否能支撑后续卷写作？
- 是否保留 来源引用？
- 是否区分 confirmed/candidate？
- 是否保存至少若干人类气味细节？
