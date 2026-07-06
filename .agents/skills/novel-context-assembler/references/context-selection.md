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
- 最近 `60_alignment/` 中的章节质量趋势和 must-fix。

## 条件读取

- confirmed vibes：长期可读。
- tentative vibes：只在 TTL 范围内读取。
- recent intake：当前任务相关时读取。
- `chapter_quality_review.md`：当任务是写下一章、审稿、风格对齐或瓶颈诊断时读取最近 1-3 章；只带低分维度、硬门槛和最小改法，不带长篇流水意见。
- 温层/冷层 summaries：只在任务需要跨卷信息时读取。

## 默认不读

- 全书正文。
- 深档案。
- 过期草稿。
- 完整 trace。
- 未确认 L3 弱猜测。
- 单章审稿里的个人偏好判断，除非已被 weekly-alignment 或作者确认。

## 输出要求

每个 context packet 必须列出 `included` 和 `excluded`，让后续 agent 知道上下文边界。

## 章节质量信息压缩

写作或审稿 context 中，质量信息最多保留：

- 最近 1-3 章各自 `decision` 和 `overall_score`。
- 连续低分维度，例如 `hook_ladder`、`human_texture`、`ai_flavor`。
- 下一章 must-fix，不超过 3 条。
- 作者已确认的取舍，例如“慢热可接受，但第一屏仍要有主角压力”。
