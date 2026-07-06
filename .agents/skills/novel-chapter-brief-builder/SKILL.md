---
name: novel-chapter-brief-builder
description: Chapter Brief / 章节作战简报；用于写新章、改章或生成 variant 前，把 context、premise、爽点、情绪曲线、人物状态和文风约束压缩成可执行章节 brief；不直接写正文。
---

# 章节作战简报

## 职责

把上下文变成下一章作战简报。它不写正文，只规定这一章必须完成什么、兑现什么、避开什么。

## 必读

- 最新 `80_context/context_packet_*.md` 或等价上下文。
- `10_bible/book_profile.yaml`、`30_plot/unresolved_hooks.md`、相关人物状态。
- 最近 1-3 章 intake/review，尤其是 hard gates、低分维度和 must-fix。
- 如有：`premise_alchemy_report`、`payoff_architecture_report`、`emotion_curve_report`、`learning_transfer_plan`。
- `../_shared/commercial-storycraft-protocol.md`。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 明确本章在长线中的功能：开局抓人、升级验证、关系推进、危机加压、爽点兑现、缓冲余波、转场铺垫。
2. 写出本章读者问题：读者看完前几章后最想知道什么。
3. 固定主角行动链：目标、压力、选择、代价、结果。
4. 指定一个主爽点和一个辅助回报，说明对应 `human_need`。
5. 指定情绪曲线：压力、蓄势、兑现、缓冲、转向。
6. 列出本章禁止项：不要解释的留白、不要复制的样本元素、不要掉书袋的设定、不要触发的毒点。
7. 给出写作验收标准；如果缺关键资料，输出 `blocked_by`。

## 输出

输出 `chapter_brief`：

- `target_chapter`
- `chapter_function`
- `reader_question`
- `protagonist_action_chain`
- `payoff_plan`
- `emotion_curve`
- `scene_beats`
- `setup_and_payoff`
- `style_constraints`
- `do_not_write`
- `canon_and_ambiguity_guards`
- `acceptance_checks`
- `blocked_by`
- `next_commands`

`scene_beats` 每条必须包含：

- `beat_goal`
- `reader_emotion`
- `protagonist_choice`
- `information_release`
- `exit_hook`

## 禁止

- 不写正文。
- 不把 brief 当 canon。
- 不把所有背景一次性塞进本章。
- 不输出泛泛“增强冲突、加强节奏”。

## 自检

- 本章主角是否有明确选择？
- 本章是否有至少一个可信回报？
- 情绪是否有波形而不是直线？
- 是否有具体章末问题？
- 是否能直接喂给 agent 或 variant 生成，而不需要再猜本章该写什么？
