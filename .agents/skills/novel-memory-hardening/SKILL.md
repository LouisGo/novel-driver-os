---
name: novel-memory-hardening
description: Memory Hardening / 完结卷记忆硬化；用于卷完结且来源充足时沉淀 cold long-term memory，生成带 source_refs、archive_path、context_policy 的硬化文件；placeholder 输出必须 blocked。
disable-model-invocation: true
---

# 完结卷记忆硬化

## 职责

把完结卷从热层/温层沉淀为冷层记忆，同时保留未来可能复活的人类气味。

## 必读

- 目标卷 温层/冷层 文件。
- `10_bible/`、`20_entities/`、`30_plot/`、已确认 vibes。
- 输出模板详见 `references/hardening-output.md`。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 先确定卷范围和 来源引用。
2. 分别提炼事实、人物、关系、氛围、名场面。
3. 单独保存 unstructured oddities。
4. 所有正史变化都标明是否已确认。
5. 运行或审计 `novel harden volume` 的输出时，如发现 placeholder 或缺 source refs，必须标记为 blocked，不得算硬化通过。

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
- `archive_path`
- `context_policy`
- `source_refs`
- `blocked_by`
- `next_commands`：如材料充足，`novel harden volume <project> <volumeId>`；如输出需重建，列出需要补采的来源文件。

## 禁止

- 不删除源文件。
- 不把未确认候选写成 confirmed canon。
- 不把怪诞细节当无用噪声删掉。
- 不把 placeholder hardening 输出当作通过结果。

## 自检

- 是否能支撑后续卷写作？
- 是否保留 来源引用？
- 是否区分 confirmed/candidate？
- 是否保存至少若干人类气味细节？
- 是否写清硬化文件进入 context 的条件和排除条件？
- 是否发现 placeholder 时输出 `blocked_by`？
