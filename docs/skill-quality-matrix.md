# 技能质量矩阵

本文件记录 20 个中文网文 技能的验收状态。评分采用统一 评分规程：结构合规、触发准确、协议安全、中文适配、可执行性、边界清楚、自检完整。通过线为平均分不低于 4，且协议安全满分。

| 技能 | 层级 | 状态 | 分数 | 打回次数 | 审稿结论 |
| --- | --- | --- | --- | --- | --- |
| novel-input-triage | P0 | 通过 | 4.5 | 0 | 能识别输入类型、权威和范围，明确不写正史。 |
| novel-author-input-packet | P0 | 通过 | 4.5 | 0 | 字段完整，保留原文和确认需求。 |
| novel-routing | P0 | 复审通过 | 4.4 | 1 | 已修正文路由顺序，强制先人工章节接入再进入胶囊。 |
| novel-human-chapter-intake | P0 | 复审通过 | 4.6 | 2 | 已移除额外字段，并补齐 `chapter` / `source_input`。 |
| novel-creative-intake-capsule | P0 | 通过 | 4.6 | 0 | 十文件协议清楚，TTL 和正史保护完整。 |
| novel-memory-patch | P0 | 通过 | 4.5 | 0 | proposal-only 边界明确，可回滚。 |
| novel-canon-checker | P0 | 通过 | 4.4 | 0 | 审稿姿态正确，保留作者偏航权。 |
| novel-context-assembler | P0 | 复审通过 | 4.6 | 2 | 已保留 `included` / `excluded` 协议键，并将子栏目中文化。 |
| novel-atmospheric-triangulation | P1 | 复审通过 | 4.4 | 1 | 已补 `status` 字段，闭合氛围假设协议。 |
| novel-confidence-decay | P1 | 复审通过 | 4.5 | 1 | 已强制保留 level/evidence/ttl/status/can_enter_decision_log。 |
| novel-intentional-ambiguity | P1 | 通过 | 4.5 | 0 | 留白保护范围和禁区可执行。 |
| novel-retcon-debt | P1 | 复审通过 | 4.4 | 1 | 已补 severity 标尺和 10 章阈值，并修回 `accepted_solution`。 |
| novel-style-miner | P1 | 复审通过 | 4.4 | 1 | 已修正 `candidate_only` 协议值。 |
| novel-style-evolution | P1 | 复审通过 | 4.6 | 1 | 已补适用范围、证据、过度使用风险和确认字段。 |
| novel-weekly-alignment | P1 | 通过 | 4.4 | 0 | 对齐目标明确，避免流水账。 |
| novel-discarded-brilliance | P2 | 通过 | 4.3 | 0 | 已中文化可见描述并保留协议字段。 |
| novel-ghost-premise-resonator | P2 | 通过 | 4.3 | 0 | 复活扫描只输出候选提醒。 |
| novel-geological-stratification | P2 | 通过 | 4.4 | 0 | 已补只输出计划、不实际移动文件的边界。 |
| novel-memory-hardening | P2 | 复审通过 | 4.5 | 1 | 已补完结卷/材料充足闸门，禁止 placeholder 通过。 |
| novel-bottleneck-finder | P2 | 通过 | 4.4 | 0 | 已要求推荐下一技能使用精确技能 ID。 |

## 主控验收结论

- 20 个技能 均具有 `name` 和 `description` frontmatter。
- 所有技能 均声明中文网文场景、输出协议和禁止直接写正史。
- 需要 references 的 5 个技能 已提供对应参考文件。
- P0、P1、P2 和抽样前测均已复审通过；后续如 CLI 协议变化，再按同一闭环打回重写。
