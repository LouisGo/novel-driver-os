# Creator Input Layer

输入层负责把任意 Markdown / TXT 文本变成统一的 Author Input Packet。

支持输入类型：

- `inspiration`
- `chapter`
- `fragment`
- `setting`
- `character`
- `worldbuilding`
- `ambiguity`
- `style_feedback`
- `discarded_idea`
- `feedback`
- `unknown`

轻标记可以降低误判：

```text
#灵感 #正文 #设定 #人设 #世界观 #留白 #文风 #废案 #反馈
#ch50 #候选 #正史 #正稿 #暂存 #不要入库
```

Author Input Packet 字段：

```yaml
input_id:
project:
source_channel:
source_type:
raw_source_path:
detected_type:
target_scope:
authority_level:
status:
confidence:
raw_text_excerpt:
system_interpretation:
requires_confirmation:
recommended_actions:
created_at:
```

输入状态机：

```text
raw -> triaged -> routed -> processed -> pending_confirmation -> applied / archived / ignored
```

