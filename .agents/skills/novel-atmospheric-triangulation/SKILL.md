---
name: novel-atmospheric-triangulation
description: Atmosphere Triangulation / 氛围三角；用于正文、片段、章末钩子或关键桥段，提出三种有证据的氛围假设，检查读者情绪、追读功能和 AI 味风险；未确认 vibe 只短期使用。
---

# 氛围三角验证

## 职责

防止 AI 用单一“氛围总结”误读作者。输出三个可供作者选择或否定的氛围假设。

## 必读

- 原始正文或片段。
- 已确认氛围：`01_intake/*/confirmed_vibes.md`。
- `40_style/anti_style.md` 和 `aspirational_style.md`。
- 需要判断氛围是否有效服务章节质量时读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。
- `../_shared/canon-safety-protocol.md`。
- 如处理长期意图或弱猜测，遵守 `novel-confidence-decay` 的 TTL 规则。

## 工作流程

1. 找原文证据，不用空泛形容词起步。
2. 生成三种不同解释：情绪底色、人物关系读法、剧情压力读法。
3. 每种假设说明 reader_function：制造压力、释放爽点、加深人味、强化悬念或降低 AI 味。
4. 每种假设给 confidence、requires_confirmation、status。
5. 明确“都不对”时作者可以手写一句氛围。
6. 未确认假设只能进入 tentative，短期使用。
7. 明确每个假设是否可进入下一章 context；L3 弱氛围默认不可长期携带。

## 输出

每个 假设 包含：

- `id`
- `name`
- `explanation`
- `evidence`
- `confidence`
- `requires_confirmation`
- `status`
- `ttl`
- `canon_policy`
- `context_policy`
- `reader_function`
- `risk_if_wrong`

## 禁止

- 不把氛围当事实。
- 不把 CP 感、爽点、压抑感强塞给作者。
- 不使用无证据的“显然”“明显”。

## 自检

- 三个假设是否真的不同？
- 是否都有原文证据？
- 是否标明未确认不能入正史，且 tentative 有有限 TTL？
- 是否写清 context 可用范围？
- 是否说明该氛围如何影响追读、钩子或人物质感？
- 是否能服务下一章语气选择？
