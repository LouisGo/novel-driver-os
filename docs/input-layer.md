# Creator Input Layer

输入层负责把任意 Markdown / TXT 文本变成统一的 Author Input Packet。

支持输入类型：

- `inspiration`
- `chapter`
- `fragment`
- `book_profile`
- `outline`
- `setting`
- `character`
- `worldbuilding`
- `ambiguity`
- `style_feedback`
- `learning_sample`
- `discarded_idea`
- `rewrite_request`
- `chapter_variant`
- `feedback`
- `unknown`

这些是系统内部分类。面向作者或 GUI 时必须显示中文分类名，例如“灵感”“章节正文”“书名/简介”“文风反馈”，不要直接展示 `detected_type` 或英文枚举。完整映射见 `docs/author-facing-language.md`。

轻标记可以降低误判：

```text
#书名 #简介 #灵感 #正文 #设定 #人设 #世界观 #大纲 #留白 #文风 #样本 #学习 #投喂 #废案 #反馈 #重写 #变体
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

这些字段是系统记录，不是默认给创作者看的界面文案。普通展示应转换为“输入编号、分类、状态、系统理解、建议下一步”。

输入状态机：

```text
raw -> triaged -> routed -> processed -> pending_confirmation -> approved_pending_apply -> applied / archived / ignored
```

`detected_type` 是主路由，`detected_intents` 保留多意图。比如 `#文风 #反馈` 可以主路由到 style candidate，同时保留 alignment feedback 意图。

书名、小说简介、题材标签属于 `book_profile`，由 `novel book set` 更新 `10_bible/book_profile.yaml`，不混入普通大纲或世界观。

题材新意、爽点、情绪曲线和章节作战简报不直接进入正史。它们应先由对应 skill 生成 report/brief，再用 `novel storycraft <premise|payoff|emotion|brief> create` 登记到 `35_storycraft/`。典型输入包括：

- “这个套路怎么包装得更新？”
- “这个爽点是不是自嗨？”
- “大战之后需要怎么缓冲？”
- “帮我为下一章做作战简报”

route 会给出 `agent: use novel-premise-alchemy`、`novel-payoff-architecture`、`novel-emotion-curve` 或 `novel-chapter-brief-builder`，随后登记 storycraft artifact。

`learning_sample` 用于“投喂优秀样本”。典型输入包括：

- “这段写得好，帮我学习它的节奏”
- “投喂这个开头，吸收它的钩子和压迫感”
- “我想学这个章末追读”
- `#样本 #学习 #投喂`

这类输入只能进入学习链路：先由 `novel-exemplar-learning` 生成 `learning_digest`，再由 `novel-learning-transfer` 转成当前项目的写作约束、练习任务、变体 brief 或 style candidate。样本原文、人物、设定、桥段、专有名词和句式都不能进入正史。
