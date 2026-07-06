---
name: novel-confidence-decay
description: 中文网文意图置信衰减技能。用于管理作者意图假设、伏笔推断、人物动机猜测、留白解释和 AI 弱猜测的等级、confidence、TTL、确认状态与归档，防止系统把脑补当正史。
---

# 意图置信衰减

## 职责

让 AI 推断有保质期。未确认意图不能永久影响长篇。

## 必读

- `01_intake/*/intention_hypotheses.yaml`。
- `10_bible/open_questions.md`。
- 相关章节目标和当前章节号。

## 等级规则

- L1 explicit：作者明确说出的意图，可长期保存为候选。
- L2 strong inference：强推断，必须有限 TTL，进入决策日志前需要确认。
- L3 weak guess：弱猜测，TTL 不超过 3 章，不得入 decision log。

## 工作流程

1. 检查每个意图的证据类型。
2. 计算是否过期、降权、归档或转入 开放问题。
3. 对后续文本支持的新证据，只能提升到“待确认”，不能自动变正史。
4. 输出作者需要确认的最少问题。

## 输出

输出 衰减报告 或 patch proposal：

- `kept`
- `downgraded`
- `expired`
- `needs_author_confirmation`
- `open_questions_patch`

每个被处理的意图项必须保留：

- `id`
- `level`
- `evidence`
- `confidence`
- `ttl`
- `status`
- `can_enter_decision_log`

## 禁止

- 不把 L2/L3 自动转为 confirmed。
- 不删除作者明确意图。
- 不用弱猜测指导自动写作。

## 自检

- 所有 L2/L3 是否有有限 TTL？
- 过期项是否离开上下文？
- 是否保留证据链？
- 是否保护作者“不解释权”？
