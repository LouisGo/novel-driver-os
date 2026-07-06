# 人工章节接入输出参考

用于 `novel-human-chapter-intake`。只在需要具体输出格式时读取。

## fact_delta 要点

- 新事实必须是具体剧情事件，例如“沈砚发现无名仙尸”，不能只写“作者提交正文”。
- 人物变化写行为和状态，不写泛泛性格总结。
- 物件状态要保留，例如灯、铃、命籍、桥碑。
- hooks_opened / hooks_closed 要区分。

## 接入报告骨架

```yaml
chapter:
source_input:
new_facts: []
entity_delta: {}
object_delta: {}
hooks_opened: []
hooks_closed: []
continuity_notes: []
style_observations: []
reader_risks: []
alignment_questions: []
source_refs: []
```

## 中文网文关注点

- 章末钩子是否兑现上一章承诺。
- 爽点是否来自人物选择、信息揭示或规则突破。
- 是否出现读者会觉得“降智”的毒点。
- 关系线是否过快暧昧化或过度冷处理。
