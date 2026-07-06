# Novel Driver OS

Novel Driver OS 是一个文件系统型网文创作副驾。它不是 AI 代写平台，也不是 Web UI 优先的自动写作系统。MVP 的目标是把创作者在手机备忘录、写作软件、纯文本编辑器中写下的正文、灵感、设定、批注、废案和文风反馈，用低摩擦方式接入项目目录，并生成可审查、可回滚、Git 友好的候选文件。

核心原则：

- 输入层优先：所有能力都从 Creator Input Layer 开始。
- 文件系统是长期记忆：模型上下文只是临时执行环境。
- AI 只能生成 candidate、proposal、patch、report、hypothesis。
- AI 不得直接覆盖 `canon_registry.md`、`style_bible.md` 或 `final.md`。
- 氛围必须有证据和确认，意图必须有置信度和 TTL。

## Manual / Assisted / Auto

MVP 只实现手动档优先的文件协议。

- Manual Mode：作者先写，系统后接。系统负责分类、提取、提醒和生成候选补丁。
- Assisted Mode：未来用于局部扩写、桥段候选、风格候选，仍不定稿。
- Auto Mode：本阶段只预留接口，不实现自动写作和自动发布。

## Install

```bash
npm install
npm run build
```

开发期可以直接用：

```bash
npm run dev -- <command>
```

协议回归检查：

```bash
npm run typecheck
npm test
```

构建后可用：

```bash
node dist/cli.js <command>
```

如需在本机使用 `novel` 命令：

```bash
npm link
novel --help
```

## Initialize A Project

```bash
novel init black_tower
```

生成：

```text
projects/black_tower/
  project.yaml
  00_inbox/
  01_intake/
  10_bible/
  20_entities/
  30_plot/
  40_style/
  50_chapters/
  60_alignment/
  70_debt/
  80_context/
  90_archive/
```

## Import From Mobile Notes

把手机备忘录导出为 Markdown 或 TXT，例如：

```markdown
#black_tower #女主 #人设 #候选
女主越在意越冷淡，不是傲娇，而是害怕暴露自己的依赖。
```

导入：

```bash
novel ingest black_tower ./sample-note.md
novel list-inputs black_tower
novel review-input black_tower <inputId>
```

导入会复制原文到 `00_inbox/raw/`，并在 `00_inbox/triaged/` 生成 Author Input Packet。

## Light Tags

MVP 支持这些轻标记：

```text
#项目名 #灵感 #正文 #设定 #人设 #世界观 #留白 #文风 #废案 #反馈
#ch50 #候选 #正史 #正稿 #暂存 #不要入库
```

例子：

```markdown
#black_tower #正文 #ch50 #正稿
她没有回头，只是把伞往他那边偏了半寸。

“你最好别死。”
```

## Human Chapter Intake

```bash
novel ingest black_tower ./sample-chapter.md
novel intake chapter black_tower <inputId>
```

系统会生成：

```text
01_intake/<inputId>/
  fact_delta.yaml
  atmosphere_triads.md
  confirmed_vibes.md
  tentative_vibes.md
  intention_hypotheses.yaml
  conflict_footnotes.md
  retcon_debt_update.yaml
  style_candidates.md
  memory_patch.yaml
  alignment_questions.md
```

这些文件都是候选或报告，不会直接写入正史。

## Confirm A Vibe

```bash
novel confirm-vibe black_tower <inputId> vibe_a
```

确认后的氛围写入 `confirmed_vibes.md`。未确认但有价值的氛围写入 `tentative_vibes.md`，只能短期参与上下文。

## Weekly Alignment

```bash
novel align weekly black_tower
```

输出到：

```text
60_alignment/weekly_reports/<date>_alignment_report.md
```

报告会回顾输入数量、系统不确定问题、需要作者确认的关键项、风格偏移观察和下周建议。

## Context Packet

```bash
novel context build black_tower --chapter ch0051
```

输出到：

```text
80_context/context_packet_ch0051.md
```

Context Packet 读取项目状态、确认氛围、待确认问题、人物卡、时间线、风格和债务摘要。它不会默认读取全书原文、deep archive、完整 trace 或未确认弱猜测。

## Retcon Debt

```bash
novel debt add black_tower --chapter ch0050 --issue "惯用手冲突" --solution "伪装身份" --severity low
novel debt report black_tower
```

当近期圆场债务超过阈值时，系统会提醒作者暂停自动圆场并回顾本卷核心冲突。

## Style / Ghost / Hardening

```bash
novel style candidate black_tower <inputId>
novel ghost scan black_tower
novel harden volume black_tower volume_01
```

- `style candidate` 只生成候选，不写 `style_bible.md`。
- `ghost scan` 扫描废案复活触发条件，生成 `ghost_resonance_report.md`。
- `harden volume` 生成冷层硬化输出，并保留 `unstructured_oddities.md`。

## Validate

```bash
novel validate black_tower
```

验证目录、必要文件、YAML、Author Input Packet、intake capsule、意图 TTL、retcon debt 和废案 resurrection trigger。

## Model Adapters

MVP 只提供 `MockModelAdapter` 和接口：

- `ModelAdapter`
- `ModelInput`
- `ModelOutput`
- `ModelCapabilities`

未来可以接 OpenAI、Claude、DeepSeek、Codex、OpenCode 或本地模型，但所有 AI 步骤都必须通过 adapter，且输出仍只能是候选、补丁或报告。
