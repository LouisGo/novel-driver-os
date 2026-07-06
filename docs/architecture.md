# Architecture

Novel Driver OS 的 MVP 是 CLI + 文件协议，不做 Web UI，不做自动写作生成。

数据流：

```text
Creator Input Layer
  -> Author Input Packet
  -> Input Triage
  -> Creative Intake Capsule
  -> Atmospheric Triangulation
  -> Memory Patch Proposal
  -> Weekly Alignment
  -> Context Assembler
```

关键边界：

- `00_inbox/raw/` 保存原始输入，不解释。
- `00_inbox/triaged/` 保存 Author Input Packet。
- `01_intake/` 保存系统理解和候选记忆补丁。
- `10_bible/` 面向长期正史，但 MVP 不让 AI 直接写入。
- `80_context/` 保存为下一步任务组装的上下文包。

正史保护：

- `canon_registry.md` 只能由作者确认后更新。
- `style_bible.md` 只能记录稳定确认过的风格。
- `memory_patch.yaml` 是 proposal，不是事实本身。

