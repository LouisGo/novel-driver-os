# Memory Stratification

长篇项目不能无限保留所有草稿、trace 和低价值报告，所以 Novel Driver OS 使用分层记忆。

层级：

- Hot Layer：当前章和最近章节，保留完整 intake 和候选。
- Warm Layer：当前卷较早剧情段，保留摘要和关键状态。
- Cold Layer：已完成卷，执行 hardening。
- Deep Archive：未来可压缩打包，MVP 不默认检索。

命令：

```bash
novel harden volume <projectName> <volumeId>
```

输出：

```text
volume_epic_summary.md
canon_changes.md
character_evolution.md
relationship_evolution.md
top_5_anchor_scenes.md
atmosphere_digest.md
unstructured_oddities.md
```

`unstructured_oddities.md` 必须保留那些不属于主线、没有明确伏笔标签、但具有人类气味的细节。

