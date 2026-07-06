---
name: novel-learning-transfer
description: 中文网文样本学习迁移技能。用于把已消化的优秀样本 learning_digest、技法卡、文风候选或作者指定想学的写法，转化为当前项目可用的写作约束、练习任务、章节改写方案或变体比稿目标；只迁移技法和读者情绪机制，不迁移原文内容、人物、设定或具体桥段。
---

# 学习迁移

## 职责

把样本学习结果转成当前项目下一步能用的写作动作。

## 必读

- 目标 `learning_digest` 或样本学习报告。
- 当前项目 `80_context/context_packet_*.md`。
- `40_style/aspirational_style.md`、`anti_style.md`、`style_candidates.md`。
- 如作用于章节：目标章节正文、review detail 或 intake capsule。

## 工作流程

1. 只读取 digest 中的 transferable techniques。
2. 对照当前项目 book profile、人物状态、世界规则和章节目标。
3. 把技法转成 3 类产物：
   - `writing_constraints`：本章必须遵守。
   - `variant_briefs`：用于生成 N 版比稿。
   - `style_candidate_patch`：候选文风规则，不直接确认。
4. 明确禁止迁移的样本元素。
5. 给出验收标准：读者应该感到什么、章末应该追问什么、主角应该完成什么行动。

## 输出

输出 `learning_transfer_plan`：

- `source_digest`
- `target_project`
- `target_scope`：chapter / arc / character / style / opening / ending。
- `writing_constraints`
- `variant_briefs`
- `do_not_copy`
- `acceptance_checks`
- `style_candidate_updates`
- `requires_author_confirmation`

如进入比稿，variant brief 必须能直接喂给：

```bash
novel variant register <project> <inputId> --from-file <draft-file> --label <label>
novel variant compare <project> <inputId>
```

## 禁止

- 不把样本桥段改头换面后塞进当前项目。
- 不要求模仿原作者句式。
- 不改变当前项目 canon。
- 不直接定稿章节。

## 自检

- 每条迁移约束是否都能在当前项目内自然成立？
- 是否明确了“不复制什么”？
- 是否能用于下一章生成或改稿？
- 是否便于后续比稿评估？

