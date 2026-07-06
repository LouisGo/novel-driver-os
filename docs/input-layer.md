# Creator Input Layer

输入层负责把任意 Markdown / TXT 文本变成统一的 Author Input Packet。

支持输入类型：

- `inspiration`
- `chapter`
- `fragment`
- `outline`
- `setting`
- `character`
- `worldbuilding`
- `ambiguity`
- `style_feedback`
- `discarded_idea`
- `rewrite_request`
- `chapter_variant`
- `feedback`
- `unknown`

轻标记可以降低误判：

```text
#灵感 #正文 #设定 #人设 #世界观 #大纲 #留白 #文风 #废案 #反馈 #重写 #变体
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
detected_intents:
target_scope:
authority_level:
status:
confidence:
raw_text_excerpt:
system_interpretation:
requires_confirmation:
recommended_actions:
source_actor:
supersedes_input_id:
created_at:
```

输入状态机：

```text
raw -> triaged -> routed -> processed -> pending_confirmation -> approved_pending_apply -> applied / archived / ignored
```

`detected_type` 是主路由，`detected_intents` 保留多意图。比如 `#文风 #反馈` 可以主路由到 style candidate，同时保留 alignment feedback 意图。
