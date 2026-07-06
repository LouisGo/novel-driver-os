---
name: novel-geological-stratification
description: Stratification / 地质分层；用于把长篇记忆分为 hot、warm、cold、deep archive，处理上下文膨胀、归档计划和 hardening 准备，并要求 rollback、snapshot 和 affected_paths。
disable-model-invocation: true
---

# 长篇地质分层

## 职责

让长篇项目不会被无限草稿、trace 和候选淹没。

## 必读

- `50_chapters/` 当前结构。
- `90_archive/`。
- 近期 intake、context、alignment、debt 状态。
- `../_shared/canon-safety-protocol.md`。

## 分层规则

- Hot：当前章和最近章节，保留完整候选、trace、intake。
- Warm：当前卷较早部分，保留摘要、状态、关键证据。
- Cold：已完成卷，准备 hardening。
- Deep Archive：低频检索，不默认进入 context。

## 工作流程

1. 判断每个文件所属层级。
2. 提出移动或压缩 proposal。
3. 保留回滚路径和来源引用。
4. 对人类气味细节标记给记忆硬化。
5. 对任何移动、压缩或归档动作标记 `snapshot_required: true`。
6. 只输出分层计划，不实际移动、压缩或删除文件，除非用户明确要求执行。

## 输出

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
- `next_commands`：通常先 `novel snapshot create <project> --label <label>`，再执行人工确认后的移动或 `novel harden volume <project> <volumeId>`。
- `blocked_by`

## 禁止

- 不删除原文。
- 不让 深档案 默认进入上下文。
- 不压缩掉未确认的重要留白。

## 自检

- 是否保留证据和回滚？
- 是否保护怪诞细节？
- 是否减少上下文负担？
- 是否在所有移动/压缩/归档前要求 snapshot？
- `affected_paths` 是否具体到项目内路径？
- 是否说明需要作者确认的移动？
