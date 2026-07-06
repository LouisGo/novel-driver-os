# Creative Intake Capsule 协议

用于 `novel-creative-intake-capsule`。

## 必备文件

1. `fact_delta.yaml`
2. `atmosphere_triads.md`
3. `confirmed_vibes.md`
4. `tentative_vibes.md`
5. `intention_hypotheses.yaml`
6. `conflict_footnotes.md`
7. `retcon_debt_update.yaml`
8. `style_candidates.md`
9. `memory_patch.yaml`
10. `alignment_questions.md`

## 关键规则

- `confirmed_vibes.md` 初始只放说明，不放未确认氛围。
- `tentative_vibes.md` 必须声明短期、不可入正史。
- L2 意图必须有限 TTL 且 `can_enter_decision_log: needs_confirmation`。
- L3 弱猜测 TTL 不超过 3 章且不得进入 decision log。
- `memory_patch.yaml` 必须 `requires_human_approval: true`。

## 自检

- 文件齐全。
- YAML 可解析。
- 每个结论有 source refs。
- 所有候选都能被作者拒绝。
