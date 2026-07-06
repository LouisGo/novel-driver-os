---
name: novel-ghost-premise-resonator
description: 中文网文亡灵伏笔唤醒技能。用于扫描 discarded_brilliance 中的废案、旧桥段、弃用反转和隐藏爽点，判断当前剧情、人设、主题或读者反馈是否让它重新有价值；只输出提醒报告。
---

# 亡灵伏笔唤醒

## 职责

在合适时机提醒“旧废案现在可能有用”，但不替作者复活。

## 必读

- `40_style/discarded_brilliance.md`。
- `10_bible/open_questions.md`。
- 当前卷目标、人物状态、未解钩子、近期对齐报告。

## 工作流程

1. 读取每条废案的 resurrection triggers。
2. 与当前项目状态做语义匹配。
3. 判断复活价值：爽点、人物质感、主题呼应、章末钩子。
4. 输出候选提醒和风险。

## 输出

输出 亡灵伏笔唤醒报告：

- `matched_discarded_id`
- `matched_triggers`
- `why_now`
- `possible_use`
- `risk`
- `requires_author_confirmation`

## 禁止

- 不自动写入大纲或正史。
- 不把任何废案判定为“必须使用”。
- 不为复活而破坏当前节奏。

## 自检

- 匹配是否有当前状态证据？
- 是否说明原舍弃原因是否仍成立？
- 是否给出“不使用也可以”的判断？
- 是否避免制造设定回收强迫症？
