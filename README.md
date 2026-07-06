# Novel Driver OS

Novel Driver OS 是一个文件系统型网文创作副驾。它不是 AI 代写平台，也不是 Web UI 优先的自动写作系统。MVP 的目标是把创作者在手机备忘录、写作软件、纯文本编辑器中写下的正文、灵感、设定、批注、废案和文风反馈，用低摩擦方式接入项目目录，并生成可审查、可回滚、Git 友好的候选文件。

核心原则：

- 输入层优先：所有能力都从 Creator Input Layer 开始。
- 文件系统是长期记忆：模型上下文只是临时执行环境。
- AI 只能生成 candidate、proposal、patch、report、hypothesis。
- AI 不得直接覆盖 `canon_registry.md`、`style_bible.md` 或 `final.md`。
- 氛围必须有证据和确认，意图必须有置信度和 TTL。
- 默认输出必须使用作者可读的中文创作语言；英文内部字段、状态值和文件路径只出现在调试、CLI JSON 或开发文档中。

## Manual / Assisted / Auto

MVP 只实现手动档优先的文件协议。

- Manual Mode：作者或 Codex agent 先写，系统后接。系统负责分类、提取、提醒、生成候选补丁、登记版本和导出章节。
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

Codex App 直接输入可以走 stdin，不必先手写临时文件：

```bash
printf '#black_tower #大纲 #候选\n第一卷：主角进入学馆。' | novel ingest black_tower --stdin --source-actor agent --json
```

导入会复制原文到 `00_inbox/raw/`，并在 `00_inbox/triaged/` 生成 Author Input Packet。

## Light Tags

MVP 支持这些轻标记：

```text
#项目名 #书名 #简介 #灵感 #正文 #设定 #人设 #世界观 #大纲 #留白 #文风 #样本 #学习 #投喂 #废案 #反馈 #重写 #变体
#ch50 #候选 #正史 #正稿 #暂存 #不要入库
```

例子：

```markdown
#black_tower #正文 #ch50 #正稿
她没有回头，只是把伞往他那边偏了半寸。

“你最好别死。”
```

## Exemplar Learning

你可以把自己觉得写得好的章节、段落、开头、章末钩子、对白或爽点片段投喂给 Codex agent：

```bash
novel ingest black_tower ./good-sample.md --json
novel route black_tower <inputId> --json
```

建议使用轻标记：

```markdown
#black_tower #样本 #学习
这段我觉得好，想学习它的开头钩子、压迫感和对白节奏。
<粘贴样本或节选>
```

`learning_sample` 不会进入 canon，也不会直接更新 style bible。route 会指向 `novel-exemplar-learning` skill，由 agent 提炼：

- 可迁移技法
- 读者情绪机制
- 不能复制的人物、设定、桥段、专有名词和句式
- 对当前项目的适配建议
- 下一章或变体比稿可用的写作约束

如果要把学习结果用于当前章节，继续使用 `novel-learning-transfer` skill 生成 `learning_transfer_plan`，再进入章节草稿、variant、review、accept 等既有 loop。

## Human Chapter Intake

```bash
novel ingest black_tower ./sample-chapter.md
novel route black_tower <inputId>
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

## Creative Input Loop

关键命令都支持 `--json`，GUI 可以只编排 CLI，不需要解析 Markdown。

```bash
novel status black_tower --json
novel route black_tower <inputId> --json
novel review queue black_tower --json
novel review detail black_tower <inputId> --json
novel review decide black_tower <inputId> --decision approve --json
novel patch apply black_tower <inputId> --target plot --json
novel context build black_tower --chapter ch0051 --json
```

主状态流：

```text
raw -> triaged -> routed -> pending_confirmation -> applied / archived / ignored
```

- `route` 生成 `00_inbox/routes/<inputId>.route.yaml`，并给出可执行 `next_commands`。
- 非章节输入可用 `novel propose <project> <inputId> --kind character|setting|worldbuilding|outline|ambiguity` 生成 memory patch proposal。
- `review decide` 只记录作者决策，不写正史；approve 后状态进入 `approved_pending_apply`。
- `patch apply` 只应用已 approve 的 `memory_patch.yaml`，并在应用前自动创建 snapshot。
- 关键动作会追加到项目根目录 `trace.jsonl`，用于 GUI 活动流和断点恢复。

## Storycraft Artifacts

题材炼金、爽点架构、情绪曲线和章节作战简报是一等创作产物，写入 `35_storycraft/`，供 CLI、Codex agent 和未来 GUI 读取。CLI 只登记 agent/作者/模型产出的报告，不直接调用模型生成内容。

```bash
novel storycraft premise create black_tower --source-input <inputId> --from-file ./premise.md --label "核心卖点" --json
novel storycraft payoff create black_tower --from-file ./payoff.md --chapter ch0001 --json
novel storycraft emotion create black_tower --from-file ./curve.md --chapter ch0002 --json
novel storycraft brief create black_tower --from-file ./brief.md --chapter ch0003 --json
novel storycraft gene create black_tower --from-file ./gene.md --json
novel storycraft serial_plan create black_tower --from-file ./serial.md --json
novel storycraft brief list black_tower --json
novel storycraft brief show black_tower <artifactId> --json
```

- `premise`：一句话卖点、题材碰撞、读者承诺。
- `payoff`：承诺、铺垫、延迟、兑现、代价和后果。
- `emotion`：压力、蓄势、兑现、缓冲、余波和转向。
- `brief`：下一章作战简报，可作为生成章节或 variant 的输入。
- `gene`：叙事机制、类型承诺、故事引擎和人物引擎报告。
- `serial_plan`：卷级、小循环和期待兑现节奏计划。
- `status --json` 会返回 `storycraft_artifacts`，`context build` 会纳入最近 storycraft 内容。

面向作者或 GUI 时，以上内部分类应显示为：创作方向、爽点设计、情绪节奏、章节作战简报。`--json` 仍保留机器字段，详见 `docs/author-facing-language.md`。

## Narrative Mechanism Layer

叙事机制提醒层把“网文理论”拆成项目状态、读者期待账本和复盘提醒，而不是固定 prompt。它只提醒和记账，不自动改正史。

```bash
novel migrate webnovel-gene black_tower --json
novel gene show black_tower --json
novel gene approve black_tower --path core_emotion --json
novel promise report black_tower --json
novel promise apply-patch black_tower <inputId> --json
novel promise pay black_tower <promiseId> --mode emotional_echo --quality expected --json
```

- `10_bible/story_engine.yaml`：字段级状态的项目叙事机制参考，不等于 canon。
- `30_plot/promise_ledger.yaml`：作者确认或允许长期参考的读者期待账本。
- `01_intake/<inputId>/promise_ledger_update.yaml`：章节 intake 生成的候选 patch，不会直接更新账本。
- `context build` 只注入当前任务可执行摘要，不注入完整理论或经典作品分析。

## Book Profile

书名和小说简介是一等项目资料，写入 `10_bible/book_profile.yaml`，会参与导出命名和 context packet。

```bash
novel book set black_tower --title "黑塔" --synopsis "一个雨夜里的长篇玄幻故事。" --genre "玄幻" --tags "升级流,悬疑" --json
novel book show black_tower --json
```

如果作者输入里出现 `#书名`、`#简介`、`作品简介`、`一句话简介` 等语义，系统会 route 到 book profile 链路，由作者确认后更新。

## Chapter Accept / Export

章节通过 review 后，可以进入定稿层：

```bash
novel chapter accept black_tower <inputId> --chapter ch0001 --layer hot --json
novel export chapters black_tower --format txt --out ./exports/black_tower --json
novel export chapters black_tower --format txt --zip ./black_tower.zip --json
```

- `chapter accept` 写入 `50_chapters/hot|warm|cold/<chapter>.txt`。
- `50_chapters/chapter_index.yaml` 维护排序、来源、章节标题和导出文件名。
- `export chapters` 只导出 accepted hot chapters，并按 chapter index 排序。
- 默认导出路径使用中文书名：`exports/<书名>_txt/0001.第一章 标题.txt` 和 `exports/<书名>.zip`。

## Variant Compare

Agent 或作者生成的多个章节候选稿可以登记为 variants：

```bash
novel variant register black_tower <inputId> --from-file ./draft-a.txt --label A --chapter ch0001 --json
novel variant register black_tower <inputId> --from-file ./draft-b.txt --label B --chapter ch0001 --json
novel variant compare black_tower <inputId> --json
novel variant decide black_tower <inputId> --variant <variantId> --json
novel chapter accept black_tower <inputId> --variant <variantId> --chapter ch0001 --layer hot --json
```

比稿报告固定检查：章节目标贴合度、主角行动链、爽点/钩子、设定一致性、人物高亮、风格贴合、AI 味、毒点风险、后续可持续性。

## Session / Snapshot

loop 可以暂停、接管、恢复和回退：

```bash
novel session status black_tower --json
novel session pause black_tower --note "作者接管世界观" --json
novel session resume black_tower --json
novel snapshot create black_tower --label "before volume rewrite" --json
novel snapshot restore black_tower <snapshotId> --json
novel project git-init black_tower --json
```

Snapshot 只恢复 `10_bible/`、`20_entities/`、`30_plot/`、`40_style/`、`50_chapters/` 和相关 manifests；raw inbox 和 trace 保留。

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
