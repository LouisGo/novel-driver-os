---
name: novel-atmospheric-triangulation
description: 中文网文章节氛围三角验证与读者情绪审稿技能。用于为正文、片段、章末钩子或关键桥段生成三种有原文证据的氛围假设，区分压抑、克制、疏离、危险、爽点、暧昧、悬疑、人味和 AI 味等方向；当需要判断氛围是否服务追读、钩子和人物质感时，给出读者情绪功能；不把未确认氛围写入正史。
---

# 氛围三角验证

## 职责

防止 AI 用单一“氛围总结”误读作者。输出三个可供作者选择或否定的氛围假设。

## 必读

- 原始正文或片段。
- 已确认氛围：`01_intake/*/confirmed_vibes.md`。
- `40_style/anti_style.md` 和 `aspirational_style.md`。
- 需要判断氛围是否有效服务章节质量时读 `../novel-human-chapter-intake/references/chapter-quality-rubric.md`。

## 工作流程

1. 找原文证据，不用空泛形容词起步。
2. 生成三种不同解释：情绪底色、人物关系读法、剧情压力读法。
3. 每种假设说明 reader_function：制造压力、释放爽点、加深人味、强化悬念或降低 AI 味。
4. 每种假设给 confidence、requires_confirmation、status。
5. 明确“都不对”时作者可以手写一句氛围。
6. 未确认假设只能进入 tentative，短期使用。

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
- `reader_function`
- `risk_if_wrong`

## 禁止

- 不把氛围当事实。
- 不把 CP 感、爽点、压抑感强塞给作者。
- 不使用无证据的“显然”“明显”。

## 自检

- 三个假设是否真的不同？
- 是否都有原文证据？
- 是否标明未确认不能入正史？
- 是否说明该氛围如何影响追读、钩子或人物质感？
- 是否能服务下一章语气选择？
