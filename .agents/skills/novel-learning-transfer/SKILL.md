---
name: novel-learning-transfer
description: Learning Transfer / 学习迁移；用于把 learning_digest 转成当前项目的写作约束、练习任务、style candidates 或 variant briefs；只迁移技法和读者情绪机制，不复制样本内容、不定稿。
---

# 学习迁移

## 职责

把样本学习结果转成当前项目下一步能用的写作动作。

## 必读

- 目标 `learning_digest` 或样本学习报告。
- 当前项目 `80_context/context_packet_*.md`。
- `40_style/aspirational_style.md`、`anti_style.md`、`style_candidates.md`。
- 如作用于章节：目标章节正文、review detail 或 intake capsule。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 只读取 digest 中的 transferable techniques。
2. 对照当前项目 book profile、人物状态、世界规则和章节目标。
3. 先确认 `digest_id`、`target_scope`、`variant_source_input_id`；缺任一关键项则输出 `blocked_by`，不要生成比稿命令。
4. 把技法转成 3 类产物：
   - `writing_constraints`：本章必须遵守。
   - `variant_briefs`：用于生成 N 版比稿。
   - `style_candidate_patch`：候选文风规则，不直接确认。
5. 明确禁止迁移的样本元素。
6. 给出验收标准：读者应该感到什么、章末应该追问什么、主角应该完成什么行动。

## 输出

输出 `learning_transfer_plan`：

- `source_digest`
- `digest_id`
- `target_project`
- `target_scope`：chapter / arc / character / style / opening / ending。
- `variant_source_input_id`：用于 `novel variant register` 的原输入 ID；通常是 rewrite_request、chapter_variant 或目标章节 input。
- `target_chapter`
- `writing_constraints`
- `variant_briefs`
- `do_not_copy`
- `acceptance_checks`
- `style_candidate_updates`
- `blocked_by`
- `next_commands`
- `requires_author_confirmation`

如进入比稿，variant brief 必须能直接喂给：

```bash
novel variant register <project> <variant_source_input_id> --from-file <draft-file> --label <label>
novel variant compare <project> <variant_source_input_id>
```

胜出稿不能直接定稿；必须继续走 `novel variant decide`、必要的 review/patch/context，以及 `novel chapter accept`。

## 禁止

- 不把样本桥段改头换面后塞进当前项目。
- 不要求模仿原作者句式。
- 不改变当前项目 canon。
- 不直接定稿章节。

## 自检

- 每条迁移约束是否都能在当前项目内自然成立？
- 是否明确了“不复制什么”？
- `variant_source_input_id` 是否明确，`next_commands` 是否可执行？
- 是否能用于下一章生成或改稿？
- 是否便于后续比稿评估？
