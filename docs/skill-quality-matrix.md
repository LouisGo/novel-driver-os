# 技能质量矩阵

本文件记录 24 个中文网文技能的验收状态。评分采用统一评分规程：结构合规、触发准确、协议安全、中文适配、可执行性、边界清楚、自检完整。通过线为平均分不低于 4，且协议安全满分。

当前调用面：17 个 model-invoked 技能用于 Codex 自动识别创作意图；7 个 user-invoked 技能保留为协议参考或手动调用，降低常态上下文负担。

| 技能 | 层级 | 状态 | 分数 | 打回次数 | 审稿结论 |
| --- | --- | --- | --- | --- | --- |
| novel-input-triage | P0 | 通过 | 4.5 | 0 | 能识别输入类型、权威和范围，明确不写正史。 |
| novel-author-input-packet | P0 | 通过，手动/参考 | 4.5 | 0 | 字段完整，保留原文和确认需求；CLI ingest 已覆盖常规封包。 |
| novel-routing | P0 | 复审通过 | 4.4 | 1 | 已修正文路由顺序，强制先人工章节接入再进入胶囊。 |
| novel-human-chapter-intake | P0 | 复审通过 | 4.6 | 2 | 已移除额外字段，并补齐 `chapter` / `source_input`。 |
| novel-creative-intake-capsule | P0 | 通过，手动/参考 | 4.6 | 0 | 十文件协议清楚，TTL 和正史保护完整；CLI intake 已覆盖常规胶囊生成。 |
| novel-memory-patch | P0 | 通过 | 4.5 | 0 | proposal-only 边界明确，可回滚。 |
| novel-canon-checker | P0 | 通过 | 4.4 | 0 | 审稿姿态正确，保留作者偏航权。 |
| novel-context-assembler | P0 | 复审通过 | 4.6 | 2 | 已保留 `included` / `excluded` 协议键，并将子栏目中文化。 |
| novel-atmospheric-triangulation | P1 | 复审通过 | 4.4 | 1 | 已补 `status` 字段，闭合氛围假设协议。 |
| novel-confidence-decay | P1 | 复审通过，手动/参考 | 4.5 | 1 | 已强制保留 level/evidence/ttl/status/can_enter_decision_log；常规路径由各技能引用安全协议处理。 |
| novel-intentional-ambiguity | P1 | 通过 | 4.5 | 0 | 留白保护范围和禁区可执行。 |
| novel-retcon-debt | P1 | 复审通过 | 4.4 | 1 | 已补 severity 标尺和 10 章阈值，并修回 `accepted_solution`。 |
| novel-style-miner | P1 | 复审通过 | 4.4 | 1 | 已修正 `candidate_only` 协议值。 |
| novel-style-evolution | P1 | 复审通过 | 4.6 | 1 | 已补适用范围、证据、过度使用风险和确认字段。 |
| novel-weekly-alignment | P1 | 通过 | 4.4 | 0 | 对齐目标明确，避免流水账。 |
| novel-discarded-resonance | P2 | 新合并入口 | 4.4 | 0 | 合并废案记录与亡灵伏笔唤醒，分 record/resonate 两个 branch。 |
| novel-discarded-brilliance | P2 | 通过，手动/参考 | 4.3 | 0 | 已被 `novel-discarded-resonance` 覆盖，保留旧入口给显式调用和历史引用。 |
| novel-ghost-premise-resonator | P2 | 通过，手动/参考 | 4.3 | 0 | 已被 `novel-discarded-resonance` 覆盖，保留旧入口给显式调用和历史引用。 |
| novel-long-memory-maintenance | P2 | 新合并入口 | 4.5 | 0 | 合并地质分层与完结卷硬化，分 stratify/harden 两个 branch。 |
| novel-geological-stratification | P2 | 通过，手动/参考 | 4.4 | 0 | 已被 `novel-long-memory-maintenance` 覆盖，保留旧入口给显式调用和历史引用。 |
| novel-memory-hardening | P2 | 复审通过，手动/参考 | 4.5 | 1 | 已被 `novel-long-memory-maintenance` 覆盖；保留 hardening 输出模板和历史引用。 |
| novel-bottleneck-finder | P2 | 通过 | 4.4 | 0 | 已要求推荐下一技能使用精确技能 ID。 |
| novel-exemplar-learning | P1 | 通过 | 4.5 | 0 | 投喂优秀样本，只提炼可迁移技法，不复制内容或写入 canon。 |
| novel-learning-transfer | P1 | 通过 | 4.5 | 0 | 把学习摘要迁移为当前项目约束、练习或 variant brief。 |

## 主控验收结论

- 24 个技能均具有 `name` 和 `description` frontmatter。
- 7 个低频、协议型或已合并旧入口已设置 `disable-model-invocation: true`。
- 所有技能均声明中文网文场景、输出协议和禁止直接写正史。
- 需要 references 的 5 个技能 已提供对应参考文件。
- P0、P1、P2 和抽样前测均已复审通过；后续如 CLI 协议变化，再按同一闭环打回重写。
