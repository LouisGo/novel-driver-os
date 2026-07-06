---
name: novel-routing
description: 中文网文输入路由技能。用于根据作者输入包 将正文、人设、设定、大纲、留白、文风反馈、废案、AI 稿反馈、读者反馈、章节质量审稿请求、开头吸引力审稿请求等输入分配到 intake、记忆补丁、style、ambiguity、debt、alignment、chapter quality review 或 archive 处理链路；不执行具体写作。
---

# 输入路由

## 职责

决定输入下一步该被哪个技能 处理，并说明原因、风险和确认点。

## 必读

- 目标 作者输入包。
- `project.yaml`。
- 如涉及正文：相关 `01_intake/` 是否已存在。
- 如涉及正史：`10_bible/open_questions.md` 和目标实体文件。

## 路由规则

- `chapter` / `fragment` -> 必须先进入 `novel-human-chapter-intake`。
- `chapter_quality_review` / `opening_review` -> `novel-human-chapter-intake`，并要求读取 `chapter-quality-rubric.md`。
- `style_review` / `ai_flavor_review` -> `novel-style-miner`；如涉及全章是否好看，同时 secondary route 到 `novel-human-chapter-intake`。
- 重要正文接入 -> 在 `novel-human-chapter-intake` 产出稳定事实提取后，再进入 `novel-creative-intake-capsule`；不得跳过人工章节接入。
- `character` / `setting` / `worldbuilding` / `outline` -> `novel-memory-patch`，必要时先 `novel-canon-checker`。
- `ambiguity` -> `novel-intentional-ambiguity`。
- `style_feedback` -> `novel-style-miner` 或 `novel-style-evolution`。
- `discarded_idea` -> `novel-discarded-brilliance`。
- 圆场方案 -> `novel-retcon-debt`。
- 系统误解反馈 -> `novel-weekly-alignment`。

## 输出

输出 `route_plan`：

- `input_id`
- `primary_route`
- `secondary_routes`
- `blocked_by`
- `confirmation_required`
- `risk_notes`
- `next_actions`

## 禁止

- 不执行路由目标技能的工作。
- 不把“重要正文”直接路由到创作接入胶囊而绕过事实提取。
- 不把 route plan 当成正史。
- 不用单一路由吞掉多目标输入。

## 中文网文检查

对“追读问题”“毒点反馈”“AI 味反馈”“章末钩子候选”“开头是否只围绕主角”“是否有人味”要路由到章节质量审稿、对齐或风格层，不要误判为普通设定。

## 自检

- 路由是否可执行？
- 是否列出阻塞项？
- 是否避免把候选设定直接导入正史？
- 是否给作者留下确认入口？
