# 完结卷硬化输出参考

用于 `novel-memory-hardening`。

## 输出文件

- `volume_epic_summary.md`：卷级摘要，写目标、代价、转折、结局。
- `canon_changes.md`：只列已确认正史变化，候选单独标注。
- `character_evolution.md`：人物欲望、选择、关系和能力状态变化。
- `relationship_evolution.md`：关系线阶段变化和未解张力。
- `top_5_anchor_scenes.md`：最能支撑后续检索的名场面。
- `atmosphere_digest.md`：确认氛围和阶段性语气变化。
- `unstructured_oddities.md`：无明确功能但有未来价值的人类气味细节。

## 写作标准

- 每个结论都要有协议键 `source_refs`。
- 不把候选写成 confirmed。
- 怪诞细节宁可多保留，不要被摘要清洗掉。
- 摘要要服务后续写作，不是读后感。
- 每个正式硬化输出必须带 `archive_path` 和 `context_policy`。
- `context_policy` 必须说明：默认是否进入 `novel context build`、何时只作 deep archive、哪些候选不得进入上下文。
- 出现 `Pending manual selection`、`MVP placeholder`、`No source snippets found` 时，正式硬化不通过，改输出 `partial_hardening_report`。

## partial_hardening_report

卷未完结或材料不足时，不输出正式硬化文件，改用：

```yaml
status: partial_hardening_report
volume:
why_not_ready:
missing_materials: []
usable_sources: []
safe_partial_outputs: []
next_collection_actions: []
source_refs: []
blocked_by: []
next_commands: []
```
