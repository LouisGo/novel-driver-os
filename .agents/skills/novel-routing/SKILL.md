---
name: novel-routing
description: Route / 输入路由；用于把已有 AuthorInputPacket 分配到 premise、payoff、emotion、brief、intake、propose、style、learning、ghost、alignment 等下一节点，输出 route_plan、responsible_roles、blocked_by 和 next_commands；不执行目标技能工作。
---

# 输入路由

## 职责

决定输入下一步该被哪个技能 处理，并说明原因、风险和确认点。

## 必读

- 目标 作者输入包。
- `project.yaml`。
- `../_shared/canon-safety-protocol.md`。
- `../_shared/commercial-storycraft-protocol.md`。
- 当前字段必须对齐 `src/route.ts` 的 `RoutePlan` 接口。
- 如涉及正文：相关 `01_intake/` 是否已存在。
- 如涉及正史：`10_bible/open_questions.md` 和目标实体文件。

## 路由规则

- `inspiration` / `book_profile` / 新书名简介 / 核心卖点 -> `novel-premise-alchemy`；如已有明确题材但缺爽点，secondary route 到 `novel-payoff-architecture`。
- `outline` / 卷纲 / 节奏安排 -> `novel-emotion-curve`；如涉及主线承诺，secondary route 到 `novel-payoff-architecture`。
- 爽点、打脸、升级、反转、关系回报、价值回报 -> `novel-payoff-architecture`。
- 节奏、缓冲、持续高潮、持续受挫、大战之后、情绪波动 -> `novel-emotion-curve`。
- 写下一章、改下一章、生成 variant 前的规划 -> `novel-chapter-brief-builder`；若缺上下文，先 `novel-context-assembler`。
- `chapter` / `fragment` -> 必须先进入 `novel-human-chapter-intake`。
- `chapter_quality_review` / `opening_review` -> `novel-human-chapter-intake`，并要求读取 `chapter-quality-rubric.md`。
- `style_review` / `ai_flavor_review` -> `novel-style-miner`；如涉及全章是否好看，同时 secondary route 到 `novel-human-chapter-intake`。
- 重要正文接入 -> 在 `novel-human-chapter-intake` 产出稳定事实提取后，再进入 `novel-creative-intake-capsule`；不得跳过人工章节接入。
- `character` / `setting` / `worldbuilding` / `outline` -> `novel-memory-patch`，必要时先 `novel-canon-checker`。
- `ambiguity` -> `novel-intentional-ambiguity`。
- `style_feedback` -> `novel-style-miner` 或 `novel-style-evolution`。
- `learning_sample` / 优秀样本投喂 -> `novel-exemplar-learning`；如要用于当前章节或比稿，secondary route 到 `novel-learning-transfer`。
- `discarded_idea` -> `novel-discarded-resonance` 的 record branch；后续扫描走 resonate branch 或 `novel ghost scan`。
- 圆场方案 -> `novel-retcon-debt`。
- 系统误解反馈 -> `novel-weekly-alignment`。

## 输出

输出 `route_plan`：

- `input_id`
- `primary_route`
- `secondary_routes`
- `responsible_roles`
- `blocked_by`
- `confirmation_required`
- `risk_notes`
- `next_actions`
- `next_commands`

## 禁止

- 不执行路由目标技能的工作。
- 不把“重要正文”直接路由到创作接入胶囊而绕过事实提取。
- 不把 route plan 当成正史。
- 不用单一路由吞掉多目标输入。

## 中文网文检查

对“追读问题”“毒点反馈”“AI 味反馈”“章末钩子候选”“开头是否只围绕主角”“是否有人味”要路由到章节质量审稿、对齐或风格层，不要误判为普通设定。

对“学习这个样本”“这段写得好”“想吸收这个章末/爽点/对白”的输入，不要路由成普通文风反馈；先做样本学习，明确 `non_transferable_elements` 和 `risk_if_copied`。

对“套路、新意、题材碰撞、爽点自嗨、情绪曲线、不要工业化、不要掉书袋”的输入，优先路由到创作中枢 skill，不要只生成 memory patch。

## 自检

- `next_commands` 是否是作者或 agent 下一步能执行的具体 CLI 命令，或明确的 `agent:` 动作？
- 是否列出阻塞项？
- `blocked_by` 非空时，是否没有假装闭环？
- 是否避免把候选设定直接导入正史？
- 是否给作者留下确认入口？
