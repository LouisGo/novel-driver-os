---
name: novel-long-memory-maintenance
description: Long Memory Maintenance / 长篇记忆维护；用于地质分层、hot/warm/cold/deep archive、卷级 hardening、snapshot/rollback 与 context_policy；只做可审计维护计划，不删除源文件。
disable-model-invocation: true
---

# 长篇记忆维护

## 职责

管理长篇项目的上下文负担和长期记忆：stratify 规划分层，harden 在卷完结且来源充足时沉淀冷层记忆。

## 必读

- `50_chapters/` 当前结构。
- `90_archive/`。
- `10_bible/`、`20_entities/`、`30_plot/`、`40_style/`、`70_debt/`。
- 近期 intake、context、alignment、debt 状态。
- `../_shared/canon-safety-protocol.md`。
- hardening 输出格式见 `../novel-memory-hardening/references/hardening-output.md`。

## Branch: stratify

用于项目上下文膨胀、卷末整理、归档计划或 hardening 准备。

输出 stratification plan：

- `hot_keep`
- `warm_compress`
- `cold_harden`
- `deep_archive_candidates`
- `oddities_to_preserve`
- `affected_paths`
- `source_refs`
- `rollback_plan`
- `snapshot_required`
- `blocked_by`
- `next_commands`

完成标准：每个移动、压缩或归档动作都有 `affected_paths`、`source_refs`、`rollback_plan`，并在执行前要求 snapshot。

## Branch: harden

用于作者明确标记完结卷，或项目存在足够温层/冷层卷级材料时。

输出硬化提案：

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
- `next_commands`

完成标准：卷范围、来源引用、confirmed/candidate 边界和 context 进入条件都清楚；若卷未完结、材料不足或输出含 placeholder，必须 blocked。

## 禁止

- 不删除源文件。
- 不把未确认候选写成 confirmed canon。
- 不让 deep archive 默认进入 context。
- 不把 placeholder hardening 输出当通过。
