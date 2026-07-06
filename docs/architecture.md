# Architecture

Novel Driver OS 的 MVP 是 CLI + 文件协议，不做 Web UI，不做自动写作生成。

数据流：

```text
Creator Input Layer
  -> Author Input Packet
  -> Input Triage
  -> Route Plan
  -> Creative Intake Capsule
  -> Atmospheric Triangulation
  -> Memory Patch Proposal
  -> Author Review Decision
  -> Patch Apply
  -> Chapter Accept / Variant Compare / Export
  -> Weekly Alignment
  -> Context Assembler
```

关键边界：

- `00_inbox/raw/` 保存原始输入，不解释。
- `00_inbox/triaged/` 保存 Author Input Packet。
- `00_inbox/routes/` 保存 route plan 和 next_commands。
- `00_inbox/reviews/` 保存作者确认、拒绝或归档决策。
- `01_intake/` 保存系统理解和候选记忆补丁。
- `10_bible/` 面向长期正史，但 MVP 不让 AI 直接写入。
- `10_bible/book_profile.yaml` 保存书名、简介、题材和标签，供 context 和导出命名使用。
- `35_storycraft/` 保存题材炼金、爽点架构、情绪曲线和章节 brief，供 GUI 和 agent 复用。
- `50_chapters/` 保存 accepted chapter 层、chapter index 和 variants。
- `80_context/` 保存为下一步任务组装的上下文包。
- `90_archive/snapshots/` 保存可恢复快照。
- `trace.jsonl` 记录关键 CLI 状态变更，便于 GUI 和 agent 断点恢复。

正史保护：

- `canon_registry.md` 只能由作者确认后更新。
- `style_bible.md` 只能记录稳定确认过的风格。
- `memory_patch.yaml` 是 proposal，不是事实本身。
- `35_storycraft/*/*.yaml` 是 report/brief manifest，不是正史或定稿正文。
- `patch apply` 只能应用已经 `review decide --decision approve` 的补丁。
- `chapter accept` 只能接受已 approve 或已 applied 的输入，variant 胜者也必须通过该入口进入章节层。
- `snapshot restore` 不覆盖 raw inbox 和 trace，只恢复长期记忆、plot、style、chapters 和 manifests。

GUI 约束：

- GUI 不拥有业务逻辑，只调用 CLI。
- 查询和状态命令必须支持 `--json`。
- Markdown 文件仍作为人类可审查 artifact 保留。
