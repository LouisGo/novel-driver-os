# 上下文选择规则

用于 `novel-context-assembler`。

## 默认读取

- `project.yaml`
- `10_bible/canon_registry.md`
- `10_bible/intentional_ambiguity.md`
- `10_bible/open_questions.md`
- 相关 `20_entities/characters`、`factions`、`locations`、`items`
- `30_plot/timeline.jsonl`
- `30_plot/unresolved_hooks.md`
- `40_style/style_bible.md`
- `40_style/anti_style.md`
- `40_style/aspirational_style.md`
- `70_debt/retcon_debt.yaml`
- `ghost_resonance_report.md`

## 条件读取

- confirmed vibes：长期可读。
- tentative vibes：只在 TTL 范围内读取。
- recent intake：当前任务相关时读取。
- 温层/冷层 summaries：只在任务需要跨卷信息时读取。

## 默认不读

- 全书正文。
- 深档案。
- 过期草稿。
- 完整 trace。
- 未确认 L3 弱猜测。

## 输出要求

每个 context packet 必须列出 `included` 和 `excluded`，让后续 agent 知道上下文边界。
