---
name: novel-ghost-premise-resonator
description: Ghost Resonance / 亡灵伏笔唤醒；用于 ghost scan 后或旧废案可能匹配当前钩子、人设、主题时，输出 candidate-only 提醒、证据和风险；不复活废案、不写大纲或正史。
disable-model-invocation: true
---

# 亡灵伏笔唤醒

## 职责

在合适时机提醒“旧废案现在可能有用”，但不替作者复活。

## 必读

- `40_style/discarded_brilliance.md`。
- `10_bible/open_questions.md`。
- 当前卷目标、人物状态、未解钩子、近期对齐报告。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 读取每条废案的 resurrection triggers。
2. 与当前项目状态做语义匹配。
3. 判断复活价值：爽点、人物质感、主题呼应、章末钩子。
4. 重新检查原舍弃原因是否仍成立。
5. 输出候选提醒和风险；未匹配时明确 `next_commands: []`，不要强行复活。

## 输出

输出 亡灵伏笔唤醒报告：

- `matched_discarded_id`
- `matched_triggers`
- `matched_evidence_refs`
- `why_now`
- `future_use_hypothesis`
- `still_discarded_reason`
- `risk`
- `status: resonance_candidate_only`
- `requires_author_confirmation`
- `blocked_by`
- `next_commands`

## 禁止

- 不自动写入大纲或正史。
- 不把任何废案判定为“必须使用”。
- 不为复活而破坏当前节奏。

## 自检

- 匹配是否有当前状态证据？
- 是否说明原舍弃原因是否仍成立？
- 是否给出“不使用也可以”的判断？
- 是否保持 `status: resonance_candidate_only`，没有写入大纲或正史？
- 没有匹配时是否明确无需动作？
- 是否避免制造设定回收强迫症？
