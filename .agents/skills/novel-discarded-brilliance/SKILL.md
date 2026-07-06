---
name: novel-discarded-brilliance
description: Discarded Brilliance / 废案资产；用于记录被舍弃的桥段、人设、设定、反转、爽点或关系线，保留 discarded_reason、latent_value 和 resurrection_triggers；不复活废案、不写正史。
disable-model-invocation: true
---

# 废案资产记录

## 职责

把废案当成延迟资产，而不是垃圾桶。

## 必读

- 废案输入全文。
- `40_style/discarded_brilliance.md`。
- 相关 开放问题、当前卷主题和人物状态。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 保留原始废案和舍弃原因。
2. 说明当时为什么不能用：削弱威胁、提前揭秘、破坏人设、抢节奏。
3. 提炼“潜在价值”，并写入协议字段 `latent_value`。
4. 设计可检测的“复活触发条件”，并写入协议字段 `resurrection_triggers`。

## 输出

输出废案条目候选：

- `id`
- `original_context`
- `idea`
- `discarded_reason`
- `latent_value`
- `resurrection_triggers`
- `future_use_hypothesis`
- `status: discarded_candidate_only`
- `next_commands`：通常是 `novel ghost scan <project>`，不直接复活。

## 禁止

- 不复活废案。
- 不把废案当伏笔硬接。
- 不覆盖当前正史。

## 自检

- 舍弃原因是否具体？
- 复活触发是否可被未来项目状态匹配？
- 是否说明只能作为候选？
- 是否没有给出直接复活方案？
- 是否避免污染当前卷方向？
