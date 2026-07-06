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

面向作者时输出“章节作战简报”，不要把 `chapter_brief` 当标题。必须使用作者态结构：

- `【类型】章节作战简报`
- `【状态】未确认`
- `【入库】不会写入正史资料，确认后可作为下一章写作用资料`
- `【用途】用于约束下一章必须完成什么、兑现什么、避开什么`
- `【一句话锚点】`：先说明本章的唯一核心任务。
- `【本章功能】`：说明本章在长线中的作用。
- `【读者问题】`：读者进入本章时最想知道什么。
- `【主角行动链】`：按 `【目标】`、`【压力】`、`【选择】`、`【代价】`、`【结果】` 展开。
- `【爽点安排】`：一个主爽点和一个辅助回报。
- `【情绪节奏】`：压力、蓄势、兑现、缓冲、转向。
- `【场景拍点】`：每个拍点包含目标、读者情绪、主角选择、信息释放、退出钩子。
- `【不要写】`：列出留白、毒点、设定灌输、样本复制等禁区。
- `【验收标准】`：写完后能直接检查的通过条件。
- `【缺失资料】`：缺关键上下文时列出阻塞项，不假装闭环。
- `【下一步】`：指向生成 variant、写正文或补上下文。

内部登记时可保存 `chapter_brief`：

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
