---
name: novel-discarded-resonance
description: Discarded Resonance / 废案资产与亡灵伏笔；用于记录废案、设计 resurrection_triggers，或在 ghost scan 后判断旧废案是否与当前钩子、人设、主题匹配；只输出 candidate-only 提醒，不复活、不写正史。
---

# 废案资产与亡灵伏笔

## 职责

把废案作为延迟资产管理：record 负责记录为什么废，resonate 负责提醒旧废案什么时候可能重新有用。两条分支都只产出候选，不复活废案。

## 必读

- 废案输入全文，或 `ghost_resonance_report.md`。
- `40_style/discarded_brilliance.md`。
- `10_bible/open_questions.md`。
- 当前卷目标、人物状态、未解钩子、近期对齐报告。
- `../_shared/canon-safety-protocol.md`。

## Branch: record

用于作者说“废案、舍弃、不要用、先记着但别进正史”。

输出废案条目候选：

- `id`
- `original_context`
- `idea`
- `discarded_reason`
- `latent_value`
- `resurrection_triggers`
- `future_use_hypothesis`
- `status: discarded_candidate_only`
- `next_commands`：通常是 `novel ghost scan <project>`。

完成标准：舍弃原因具体、潜在价值明确、触发条件可被未来项目状态匹配，且没有给出直接复活方案。

## Branch: resonate

用于 ghost scan 之后，或旧废案可能匹配当前钩子、人设、主题时。

输出亡灵伏笔唤醒报告：

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

完成标准：匹配有当前状态证据，原舍弃原因是否仍成立已说明，没有匹配时明确 `next_commands: []`。

## 禁止

- 不复活废案。
- 不写入大纲或正史。
- 不把任何废案判定为“必须使用”。
- 不为复活而破坏当前节奏。
