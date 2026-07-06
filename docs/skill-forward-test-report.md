# 技能前测报告

## 验证方式

本轮采用结构校验、主控审稿和抽样前测组合。前测目标是确认另一个 agent 只读技能后能按商业连载叙事协议执行任务，而不是复述本计划。

## 抽样任务

1. `novel-input-triage`：给一段同时包含人设、关系线和卷大纲的中文输入，要求输出类型、权威、目标范围和下一步技能。
2. `novel-human-chapter-intake`：给 `qingming_du` ch0001 正文，要求提取真实事实、物件状态、钩子和追读风险。
3. `novel-context-assembler`：为 ch0002 组装上下文，要求包含人物、势力、地点、物件并排除过期弱猜测。
4. `novel-style-evolution`：给文风反馈和 AI 稿反馈，要求区分 style_bible 候选、aspirational、anti_style 和 entropy。
5. `novel-long-memory-maintenance`：给 volume_01 温层笔记，要求走 harden branch，输出七类硬化文件规划。
6. `novel-premise-alchemy`：给普通升级流灵感，要求炼出熟悉母题、陌生变量和一句话卖点。
7. `novel-payoff-architecture`：给一个打脸/升级爽点，要求判断是否有承诺、代价、后果和人性回报。
8. `novel-emotion-curve`：给大战后章节安排，要求设计缓冲、余波和下一轮期待。
9. `novel-chapter-brief-builder`：给 context packet，要求输出可直接用于写下一章的作战简报。

## 通过标准

- 输出中文优先。
- 不直接写正史。
- 判断带证据。
- 能说清下一步作者确认什么。
- 未确认内容保持 candidate/proposal/report/hypothesis。
- 创作建议必须落到题材新意、真实爽点、情绪曲线或反工业化证据，不能只给泛文学建议。

## 当前结果

- 结构校验：28 个技能均通过 frontmatter 结构检查；其中 20 个保留 model-invoked，8 个降为 user-invoked。
- 抽样前测：9 个技能均完成只读前测。原 `novel-memory-hardening` 因缺少完结卷/材料充足闸门被打回一次，已补 `partial_hardening_report` 和 placeholder 禁止规则；现在由 `novel-long-memory-maintenance` 的 harden branch 作为手动/参考入口承接。
- 创作中枢复审：新增 `novel-premise-alchemy`、`novel-payoff-architecture`、`novel-emotion-curve`、`novel-chapter-brief-builder`，并将 `novel-long-memory-maintenance` 降为手动/参考，避免低频维护挤占自动触发面。
- P0 复审：`novel-routing`、`novel-human-chapter-intake`、`novel-context-assembler` 被打回并重写后通过。
- P1 复审：`novel-atmospheric-triangulation`、`novel-confidence-decay`、`novel-style-miner`、`novel-style-evolution`、`novel-retcon-debt` 被打回或补强后通过；本轮追加反掉书袋、反工业化和样本机制迁移能力。
- P2 复审：整体通过；`novel-discarded-brilliance` 与 `novel-ghost-premise-resonator` 合并为 `novel-discarded-resonance`，`novel-geological-stratification` 与 `novel-memory-hardening` 合并为 `novel-long-memory-maintenance`，旧入口保留为手动/参考调用。
- 已知风险：28 个技能为 v1 文本化工作流，新增创作中枢尚未全部绑定 CLI 命令；后续如果 CLI 增加新命令，需要同步更新技能。

## 历史产物备注

`projects/qingming_du` 中早先生成的 hardening 示例仍有旧 placeholder。按新技能规则，这些不能算通过结果；它们属于历史样例产物，需要未来重跑或隔离，不影响当前技能验收。
