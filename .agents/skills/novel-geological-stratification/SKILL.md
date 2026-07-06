---
name: novel-geological-stratification
description: 中文长篇网文地质分层技能。用于管理 热层、温层、冷层、深档案 记忆层，把当前章、近期章节、已完成卷、旧草稿和 trace 分层存放，避免上下文膨胀和长期记忆污染。
---

# 长篇地质分层

## 职责

让长篇项目不会被无限草稿、trace 和候选淹没。

## 必读

- `50_chapters/` 当前结构。
- `90_archive/`。
- 近期 intake、context、alignment、debt 状态。

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
5. 只输出分层计划，不实际移动、压缩或删除文件，除非用户明确要求执行。

## 输出

输出 stratification plan：

- `hot_keep`
- `warm_compress`
- `cold_harden`
- `deep_archive_candidates`
- `oddities_to_preserve`

## 禁止

- 不删除原文。
- 不让 深档案 默认进入上下文。
- 不压缩掉未确认的重要留白。

## 自检

- 是否保留证据和回滚？
- 是否保护怪诞细节？
- 是否减少上下文负担？
- 是否说明需要作者确认的移动？
