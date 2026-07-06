# 作者可读语言规范

Novel Driver OS 的默认输出对象是创作者，不是开发者。系统可以保留内部字段和命令，但默认展示必须先使用中文创作语言。

## 分层原则

- 作者默认看到：草案、方向、卖点、追读点、风险、下一步选择。
- 高级信息可以看到：是否已保存、是否待确认、会影响哪些资料。
- 调试和自动化才看到：字段名、状态值、文件路径、命令和 JSON。

`--json` 输出保持机器可读，不做中文化。普通 CLI 输出、GUI、agent 对话和 Markdown 报告应优先使用作者可读语言。

## 分类显示名

| 内部分类 | 作者看到的分类 |
| --- | --- |
| inspiration | 灵感 |
| chapter | 章节正文 |
| fragment | 正文片段 |
| book_profile | 书名/简介 |
| outline | 大纲 |
| setting | 设定 |
| character | 人设 |
| worldbuilding | 世界观 |
| ambiguity | 有意留白 |
| style_feedback | 文风反馈 |
| learning_sample | 样本学习 |
| discarded_idea | 废案 |
| rewrite_request | 重写/比稿 |
| chapter_variant | 章节版本 |
| feedback | 反馈 |
| unknown | 待判断 |

## 创作产物显示名

| 内部分类 | 作者看到的分类 |
| --- | --- |
| premise | 创作方向 |
| payoff | 爽点设计 |
| emotion | 情绪节奏 |
| brief | 章节作战简报 |

## 状态显示名

| 内部状态 | 作者看到的状态 |
| --- | --- |
| raw | 已收到原文 |
| triaged | 已初步判断 |
| routed | 已建议下一步 |
| processed | 已处理 |
| pending_confirmation | 等待确认 |
| approved_pending_apply | 已确认，待写入 |
| applied | 已写入 |
| archived | 已归档 |
| ignored | 已忽略 |

## 写作规则

- 不把英文内部字段当标题，例如 `premise_alchemy_report`、`detected_type`、`route_plan`。
- 可以保留“分类感”，但用中文名表达，例如“分类：创作方向”“状态：等待确认”。
- 默认不要输出 YAML、JSON 或字段清单；只有用户要求技术细节、调试、命令或文件结构时才展示。
- 命令可以作为“高级操作”出现，但正文解释必须先说明它对创作者意味着什么。
- 报告里必须先回答创作问题，再列系统记录。
