# Novel Driver OS V3.1

## 创作者输入优先的作者对齐型网文辅助写作系统

---

# 0. 系统定位

Novel Driver OS 不是 AI 代写系统，也不是自动生成网文的平台。

它是一套：

```text
以创作者输入为源头，
以文件系统为长期记忆，
以 Creative Intake 为记忆入口，
以作者对齐为校准机制，
以 AI 为辅助基础设施，
支持手动档、辅助档、自动档自由切换的
长期网文创作副驾系统。
```

它的核心不是“AI 写得多快”，而是：

> **创作者在任意地方写下的第一句话，都能以最低摩擦流入系统，并以最高保真进入长期创作记忆。**

系统要服务的不是“一个懒得写的人”，而是一个有创作欲、有审美、有判断、有时想自己开、有时想省心的创作者。

---

# 1. V3.1 的第一性原则

## 1.1 创作者优先

创作者永远拥有方向盘。

AI 可以辅助、提醒、整理、生成候选、检查冲突、维护记忆，但不能剥夺作者的：

```text
手写权
偏航权
留白权
反悔权
不解释权
最终裁决权
```

系统不能把作者变成 AI 草稿的审核员，更不能让流程绑架创作冲动。

---

## 1.2 输入层优先

系统不是从“AI 如何生成正文”开始，而是从：

```text
作者在哪里写？
写下来的东西如何流入系统？
系统如何识别它是什么？
系统如何判断它的权威等级？
系统如何避免误读？
```

开始。

所以 V3.1 的第一模块是：

```text
Creator Input Layer
创作者输入层
```

没有输入层，所有后续的记忆、风格、对齐、自动档都是空中楼阁。

---

## 1.3 保真不是 AI 单方面完成的

AI 不能自证自己真的懂作者。

所以系统不能假设：

```text
AI 提取的氛围 = 作者真实想表达的氛围
AI 推断的意图 = 作者真实创作意图
AI 总结的风格 = 作者真实风格方向
```

V3.1 的保真必须通过：

```text
多重假设
原文证据
置信度
临时记忆
作者确认
定期对齐
衰减机制
```

共同完成。

---

## 1.4 事实、氛围、意图必须分开

系统要严格区分三类信息：

```text
事实：主角放走了赵临。
氛围：这一章读完后有一种压抑但未爆发的怒意。
意图：作者可能想让主角从复仇者转向规则利用者。
```

事实可以提取。
氛围需要三角验证。
意图需要置信度和衰减机制。

三者不能混进同一个普通摘要里。

---

## 1.5 AI 不能直接改正史

AI 只能生成：

```text
candidate
proposal
patch
report
draft
hypothesis
```

不能直接覆盖：

```text
canon_registry.md
style_bible.md
final.md
published chapters
hard canon
```

所有正史变更都必须经过作者确认。

---

# 2. 系统总体架构

V3.1 的完整架构如下：

```text
Creator Input Layer
创作者输入层
  ↓
Author Input Packet
作者输入包
  ↓
Input Triage
输入分流
  ↓
Creative Intake Capsule
创作接入胶囊
  ↓
Atmospheric Triangulation
氛围三角验证
  ↓
Confidence Decay Lock
意图置信度衰减锁
  ↓
Socratic Nudge + Retcon Debt
软性提醒 + 圆场债务
  ↓
Style Evolution System
文风演化系统
  ↓
Memory Patch Proposal
记忆补丁提案
  ↓
Weekly Alignment Session
周期性作者对齐
  ↓
Context Assembler
上下文组装器
  ↓
Manual / Assisted / Auto / Review Mode
手动档 / 辅助档 / 自动档 / 审稿档
```

其中最重要的顺序是：

> **先输入，再接入；先保真，再记忆；先对齐，再自动。**

---

# 3. 四种驾驶模式

## 3.1 Manual Mode：手动档

适用场景：

```text
作者灵感爆发
作者想自己写关键章
作者想试新文风
作者想故意偏离大纲
作者不希望 AI 打断
```

系统行为：

```text
不要求章节合约
不强制模板
不自动润色
不擅自重写
不把自由写作规训成标准网文
```

系统只在作者提交后执行：

```text
识别输入
提取事实
三角验证氛围
推断意图但标注置信度
检查冲突但温和提醒
生成记忆补丁
等待作者确认
```

核心原则：

> **作者先写，系统后接。**

---

## 3.2 Assisted Mode：辅助档

适用场景：

```text
作者有方向，但需要 AI 展开
作者想要桥段候选
作者想要对话、动作、章末钩子备选
作者想局部改写
```

系统行为：

```text
AI 生成候选
AI 不定稿
AI 不入正史
AI 不替作者做最终判断
```

适合命令：

```text
给我三个章末钩子
帮我扩写这个场景
帮我把这段对白写得更克制
帮我检测这一段 AI 味
帮我生成两个不同情绪方向的版本
```

---

## 3.3 Auto Mode：自动档

适用场景：

```text
作者想省心
作者暂时只想做判断
需要日更产能
需要系统自动推进一章或多章草稿
```

系统行为：

```text
组装上下文
生成章节合约
多稿并行
Pareto Filter 筛掉明显劣解
Reader Blind Test 模拟读者反应
输出压缩后的少量关键选择
等待作者确认
```

自动档不能直接发布，不能直接改正史。

---

## 3.4 Review Mode：审稿档

适用场景：

```text
作者已经写完
只想检查问题
不希望 AI 改写
```

系统行为：

```text
只读
只检查
只报告
不润色
不替换表达
不改正文
```

输出：

```text
设定冲突
时间线问题
人物状态漂移
AI 味风险
伏笔遗漏
节奏风险
读者反馈预测
```

---

# 4. 创作者输入层：Creator Input Layer

## 4.1 输入源

系统必须支持作者在任意地方写作：

```text
手机备忘录
微信文件传输助手
写作软件
Obsidian
Notion
Typora
VSCode
Cursor
Codex / OpenCode 项目文件
纯文本文件
直接聊天粘贴
```

系统不能强迫作者进入复杂后台填表。

---

## 4.2 输入类型

创作者输入至少分为以下类型：

```text
inspiration：灵感碎片
chapter：完整章节
fragment：正文片段
setting：设定想法
character：人设想法
worldbuilding：世界观想法
ambiguity：有意留白
style_feedback：文风反馈
discarded_idea：废案 / 被舍弃灵感
feedback：作者对 AI 稿的反馈
unknown：无法判断
```

---

## 4.3 三档输入格式

### 4.3.1 零格式输入

作者自然写：

```text
女主不是不信主角，而是太早信过别人。
她越在意，越会装作无所谓。
```

系统自动识别为可能的：

```text
人设候选
关系线候选
角色口吻规则
```

但不会直接入正史。

---

### 4.3.2 轻标记输入

推荐日常使用。

```text
#黑塔 #女主 #人设 #候选
女主越在意越冷淡，不是傲娇，而是害怕暴露自己的依赖。
```

或：

```text
#黑塔 #正文 #ch50 #正稿
她没有回头，只是把伞往他那边偏了半寸。

“你最好别死。”
```

或：

```text
#黑塔 #留白 #ch50
女主这里为什么停顿暂时不要解释，至少 ch80 之前不要说破。
```

轻标记足够低摩擦，又能显著降低误判。

---

### 4.3.3 显式输入包

用于严肃变更。

```markdown
---
project: black_tower
type: character_patch
target: heroine
status: proposal
effective_from: ch_030
authority: candidate
---

女主从第 30 章后不再只是外冷内热，而是外冷内怯。
```

日常不强制使用。

---

# 5. Author Input Packet：作者输入包

无论作者从哪里输入，系统内部统一转成：

```yaml
input_id: input_2026_07_06_001
project: black_tower
source_channel: mobile_note
source_type: human
raw_source_path: 00_inbox/raw/input_001.md

detected_type: character
target_scope:
  entity: heroine
  chapter: null
  volume: volume_01

authority_level: L1_candidate
status: triaged
confidence: 0.78

raw_text_excerpt: |
  女主越在意越冷淡，不是傲娇，而是害怕暴露自己的依赖。

system_interpretation:
  - 这可能是女主人设候选。
  - 也可能是女主与主角关系推进规则。

requires_confirmation: true

recommended_actions:
  - add_to_character_candidates
  - add_to_relationship_arc_candidates
```

这叫：

```text
Author Input Packet
```

它是创作者输入进入系统的统一接口。

---

# 6. 输入状态机

所有输入都不直接入库，而是经过状态机：

```text
raw
  ↓
triaged
  ↓
routed
  ↓
processed
  ↓
pending_confirmation
  ↓
applied / archived / ignored
```

含义：

```text
raw：原始输入，只保存，不解释
triaged：已初步分类
routed：已分配处理路径
processed：已生成接入结果
pending_confirmation：等待作者确认
applied：已入库
archived：归档
ignored：忽略
```

低风险输入可以批量确认。
高风险输入必须即时确认。

---

# 7. 输入权威等级

系统必须知道不同输入的权威不同。

```text
L0 随手灵感
L1 候选设定
L2 作者批注
L3 作者明确指令
L4 作者亲写正文
L5 作者确认正稿
L6 已发布正文
```

规则：

```text
手机备忘录默认 L0 / L1
轻标记 #候选 默认 L1
轻标记 #正稿 默认 L4 / L5
作者明确命令默认 L3
已发布正文默认 L6
AI 草稿永远低于作者输入
```

如果冲突，按权威等级处理：

```text
作者明确指令 > 作者亲写正文 > 作者确认正稿 > 已发布正文 > 作者确认 patch > AI 提取 > AI 草稿 > AI 脑暴
```

---

# 8. 项目目录结构

V3.1 标准项目结构：

```text
projects/my-novel/
  project.yaml

  00_inbox/
    raw/
    triaged/
    processed/
    ignored/

  01_intake/
    creative_intake_<inputId>/
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

  10_bible/
    canon_registry.md
    world_contract.md
    power_system.md
    intentional_ambiguity.md
    open_questions.md

  20_entities/
    characters/
      protagonist.yaml
      heroine.yaml
    factions/
    locations/
    items/
    relationship_graph.md

  30_plot/
    timeline.jsonl
    event_ledger.jsonl
    foreshadowing.md
    unresolved_hooks.md

  40_style/
    style_bible.md
    aspirational_style.md
    anti_style.md
    discarded_brilliance.md
    style_entropy_budget.md

  50_chapters/
    hot/
    warm/
    cold/

  60_alignment/
    weekly_reports/

  70_debt/
    retcon_debt.yaml

  80_context/
    context_packet_ch0051.md

  90_archive/
```

关键设计：

```text
00_inbox 是输入入口
01_intake 是系统理解入口
10_bible 之后才是长期记忆
50_chapters 不再是唯一中心
```

---

# 9. Creative Intake Capsule：创作接入胶囊

当作者提交章节、正文片段、重要设定或批注时，系统生成 Creative Intake Capsule。

它不是普通摘要，而是多层接入文件包。

## 9.1 fact_delta.yaml

记录事实变化。

```yaml
chapter: ch_0050
source: human

new_facts:
  - 主角放走赵临。
  - 女主第一次违抗家族命令。
  - 黑塔第三层出现无名碑。

character_changes:
  protagonist:
    - 从单纯复仇转向规则利用
  heroine:
    - 从旁观者转为实际站队

hooks_opened:
  - 无名碑是谁留下的？
  - 赵临被放走后会引出什么后果？

hooks_closed: []

constraints_for_future:
  - 后续不能把主角写成简单嗜杀。
  - 女主和主角关系不能退回完全陌生。

source_refs:
  - file: 00_inbox/raw/input_001.md
```

---

## 9.2 atmosphere_triads.md

生成三种对立氛围假设。

每种假设必须包含：

```text
氛围名称
简短解释
支持该假设的原文证据句
置信度
是否需要作者确认
```

示例：

```markdown
## Hypothesis A：压抑的愤怒

解释：
主角表面克制，但行动里有明显延迟报复倾向。

证据：
1. “他把那枚碎掉的玉扣收进袖中，没有说话。”
2. “赵临以为自己逃过了一劫。”
3. “主角只是看着雨水把血冲进石缝里。”

confidence: 0.72
requires_confirmation: true
```

---

## 9.3 confirmed_vibes.md / tentative_vibes.md

作者确认的氛围进入：

```text
confirmed_vibes.md
```

未确认但可能有用的进入：

```text
tentative_vibes.md
```

规则：

```text
confirmed vibe 可长期高权重读取
tentative vibe 只能短期影响上下文
未确认氛围不能固化为正史
```

---

## 9.4 intention_hypotheses.yaml

意图假设分三层。

```yaml
intention_hypotheses:
  - id: intent_ch0050_01
    level: L1_explicit
    content: 主角放走赵临不是心软，而是要利用他引出更大敌人。
    evidence:
      - author_note
    confidence: 1.0
    ttl: permanent
    can_enter_decision_log: true
    status: pending_confirmation

  - id: intent_ch0050_02
    level: L2_strong_inference
    content: 主角正在从情绪复仇转向规则利用。
    evidence:
      - 主角放走赵临
      - “活着比死了有用”
    confidence: 0.84
    ttl: 5_chapters
    can_enter_decision_log: needs_confirmation
    status: tentative

  - id: intent_ch0050_03
    level: L3_weak_guess
    content: 主角喝茶烫到嘴暗示他心神不宁。
    evidence:
      - 主角喝茶时停顿
    confidence: 0.31
    ttl: 3_chapters
    can_enter_decision_log: false
    status: temporary
```

规则：

```text
L1：作者明确意图，可进入 decision_log 候选
L2：强推断，需要确认
L3：弱猜测，不得进入正史，只能短期存在，并自动衰减
```

---

## 9.5 conflict_footnotes.md

冲突不能直接报错，要用苏格拉底式软提醒。

示例：

```markdown
## Footnote 001

检测到一个小注脚：

前文主角惯用左手，但这里写成右手拔剑。

如果你是有意为之，例如伪装身份或右手藏招，可以忽略。
如果是笔误，系统可以生成一个 50 字以内的圆场补丁。

建议：
- 忽略，视为作者有意偏航
- 生成圆场补丁
- 手动修改原文
```

---

## 9.6 retcon_debt_update.yaml

如果作者接受 AI 圆场补丁，则记录圆场债务。

```yaml
entry:
  chapter: ch_0050
  issue: 主角惯用左手，但写成右手拔剑
  accepted_solution: 解释为主角故意用右手伪装
  debt_type: continuity_patch
  severity: low
```

---

## 9.7 style_candidates.md

从作者输入中提取文风候选。

```markdown
# Style Candidates - ch_0050

观察：
1. 作者倾向于用动作表达情绪，而不是心理解释。
2. 女主关心主角时采用反向表达。
3. 章末不一定使用强钩子，可以用不安感收束。

状态：
candidate only，不进入 style_bible，等待 Weekly Alignment 确认。
```

---

## 9.8 memory_patch.yaml

所有记忆更新都以 patch 形式存在。

```yaml
patch_id: patch_ch0050_001
requires_human_approval: true

updates:
  timeline:
    add_event:
      chapter: ch_0050
      event: 主角放走赵临

  unresolved_hooks:
    add:
      - 无名碑来源
      - 赵临被放走后的后果

  characters:
    protagonist:
      candidates:
        - 从情绪复仇转向规则利用
```

AI 不直接写正史。

---

# 10. Atmospheric Triangulation：氛围三角验证

单一氛围总结容易变成 AI 二创幻觉。

所以每次 Intake 必须生成三种不同氛围解释：

```text
A：压抑愤怒
B：冰冷疏离
C：疲惫克制
```

并附原文证据。

系统向作者提问：

```text
本章氛围更接近：
A 压抑愤怒
B 冰冷疏离
C 疲惫克制
D 都不对，我手动写一句
E 暂不确认，只作为下一章临时风向
```

只有作者确认后的氛围才能长期进入 Context Assembler。

---

# 11. Confidence Decay Lock：置信度衰减锁

AI 的意图推测不能永久存在。

规则：

```text
L1 显性意图：可长期保存
L2 强推断意图：需要作者确认，默认 TTL 5 章
L3 弱猜测意图：不得入正史，默认 TTL 3 章
```

如果未被作者确认，也未被后续行为支持，则：

```text
降权
移入 open_questions
归档
删除
```

这防止 AI 把废笔过度解释为伏笔。

---

# 12. Socratic Nudge：软性苏格拉底式质疑

冲突分四级：

```text
L1 Footnote：静默注脚
L2 Gentle Nudge：温和提醒
L3 Review Required：需要确认
L4 Hard Block：系统安全阻止
```

## 12.1 L1 Footnote

轻微问题，不打断作者。

```text
惯用手
称呼轻微变化
小物件位置
语气轻微漂移
```

---

## 12.2 L2 Gentle Nudge

中等问题，温和提醒。

```text
人物关系突变
能力边界轻微突破
时间线轻微冲突
```

---

## 12.3 L3 Review Required

需要确认。

```text
角色知道了不该知道的信息
已死角色出现
重大伏笔提前暴露
```

---

## 12.4 L4 Hard Block

只用于系统安全问题。

```text
未经确认覆盖 final.md
删除 canon_registry
自动修改 human_final
未经确认修改硬设定
```

---

# 13. Retcon Debt Ledger：圆场债务账本

圆场补丁有用，但不能让作者无意识依赖。

记录：

```yaml
current_arc_total: 4
last_10_chapters: 3
threshold: 3

entries:
  - chapter: ch_0051
    issue: 主角惯用左手，但写成右手拔剑
    accepted_solution: 圆成“主角故意用右手伪装”
    debt_type: continuity_patch
    severity: low
```

当债务过高，系统提醒：

```text
过去 10 章内你接受了 3 次圆场补丁。
这说明本卷设定偏移开始变多。

建议进入 5 分钟硬核手动模式：
1. 回顾本卷核心冲突
2. 确认主角当前目标
3. 确认女主知道什么、不知道什么
4. 确认下一章是否继续自动档
```

---

# 14. Style Evolution System：文风演化系统

V3.1 不把文风学习等同于“模仿作者当前水平”。

文风分为五个文件：

```text
style_bible.md
aspirational_style.md
anti_style.md
discarded_brilliance.md
style_entropy_budget.md
```

## 14.1 style_bible.md

只记录长期确认过的稳定规则。

```text
关键情绪优先通过动作和对白呈现。
避免“忽然意识到”“心中一颤”。
女主表达关心时倾向于反向表达。
```

---

## 14.2 aspirational_style.md

记录作者想靠近的方向。

```yaml
aspirational_style:
  suspense_texture:
    target: 更强的悬疑克制感
    reference_quality: 类似《诡秘之主》前期的信息遮蔽和世界压迫
    warning: 不模仿句式，不复制设定，只抽象气质

  power_curve:
    target: 爽点更强
    requirement: 爽点翻倍，但不牺牲悬疑氛围
```

---

## 14.3 anti_style.md

记录作者明确不要什么。

```text
不要解释性心理鸡汤。
不要反派长篇自曝。
不要“嘴角勾起一抹冷笑”。
不要每章都靠强钩子收尾。
不要把所有沉默写成“气氛凝固”。
```

---

## 14.4 discarded_brilliance.md

记录被舍弃但有潜在价值的灵感。

```yaml
id: discarded_ch0050_villain_kneel
original_context: ch_0050
idea: 反派赵临在雨夜跪地求生。
discarded_reason: 当时会削弱他的威胁感。
latent_value: 可用于反派彻底失势后的尊严崩塌。
resurrection_triggers:
  - villain.zhaolin.power_level < 20
  - current_arc.theme includes "旧敌清算"
suggested_future_use:
  - 反派跪地不是求饶，而是用最低姿态提出最危险的交易。
```

---

## 14.5 style_entropy_budget.md

防止系统把文风锁死。

```yaml
style_entropy_budget:
  per_10_chapters:
    allow_experimental_drafts: 2
    allow_voice_deviation: medium
    force_non_default_variant: true

exploration_axes:
  - 更冷的叙事
  - 更密的信息遮蔽
  - 更强的感官细节
  - 更少解释的关系推进
```

系统不仅学习“现在的作者”，还服务于“作者想成为的作者”。

---

# 15. Ghost Premise Resonator：亡灵伏笔唤醒器

废案不是垃圾，而是延迟资产。

系统定期扫描 `discarded_brilliance.md`，如果当前剧情状态触发 resurrection_triggers，则提醒作者。

示例：

```text
你在 ch_0050 曾舍弃“赵临雨夜跪地求生”。
当时舍弃原因：削弱威胁感。
当前状态：赵临权力值已跌至 15%，且主角不再惧怕他。

该废案现在可能变成“旧敌尊严崩塌”的有效场景。
是否加入本章候选？
```

---

# 16. Geological Stratification：地质分层归档

长篇不能无限保留所有草稿和 trace。

分四层：

```text
Hot Layer：热层，当前章 + 最近 50 章
Warm Layer：温层，当前卷较早剧情段
Cold Layer：冷层，已完成卷
Deep Archive：深档案，压缩存储
```

---

## 16.1 Hot Layer

保留：

```text
A/B/C 草稿
评估报告
trace
fact_delta
atmosphere_triads
confirmed_vibes
style_candidates
memory_patch
```

---

## 16.2 Warm Layer

保留：

```text
final
state / fact delta
atmosphere ledger
arc digest
关键 trace 摘要
```

压缩普通草稿和低价值报告。

---

## 16.3 Cold Layer

完成卷后执行 Memory Hardening，生成：

```text
volume_epic_summary.md
canon_changes.md
character_evolution.md
relationship_evolution.md
top_5_anchor_scenes.md
atmosphere_digest.md
unstructured_oddities.md
```

---

## 16.4 unstructured_oddities.md

专门保存那些：

```text
不属于主线
没有明确伏笔标签
但具有人类气味
未来可能变成神来之笔
```

例如：

```markdown
## Oddity 001
ch_0017：城门守卫每次说话前都会哼半句跑调的童谣。
当前功能：无。
可能价值：未来可作为暗线势力的声音锚点。

## Oddity 002
ch_0032：女主讨厌靛蓝色，但没有解释原因。
当前功能：氛围细节。
可能价值：可与童年记忆、家族禁忌或旧伤有关。
```

这是为了防止硬化摘要杀死未来灵感。

---

# 17. Context Assembler：上下文组装器

AI 写作时绝不读取全书原文。

Context Packet 读取：

```text
project.yaml
project_charter
canon_registry
intentional_ambiguity
confirmed_vibes
tentative_vibes
相关人物卡
timeline
unresolved_hooks
style_bible
aspirational_style
anti_style
retcon_debt
ghost_resonance_report
current arc summary
recent intake capsule
```

默认不读取：

```text
全书原文
过期草稿
完整 trace
deep archive
无关人物卡
未确认弱猜测
```

原则：

> **原文负责留证，状态负责创作，检索负责补充，上下文包负责执行。**

---

# 18. Weekly Alignment Session：周期性作者对齐会

每周或每 10 章运行一次。

目标不是生成报表，而是校准系统是否误解作者。

## 18.1 输入回顾

```text
本周输入：
灵感碎片 17 条
正文片段 4 条
人设候选 3 条
废案 2 条
留白说明 5 条
风格反馈 6 条
```

---

## 18.2 系统不确定的问题

从以下文件汇总：

```text
intention_hypotheses
tentative_vibes
open_questions
style_candidates
conflict_footnotes
```

只列最重要的 3-5 条。

---

## 18.3 深层矛盾校准

例如：

```text
关于主角深层欲望，系统目前有两个推测：

A. 主角真正想要的是夺回选择权。
B. 主角真正想要的是避免再次失去重要之人。

请作者定调：
1. A 更接近
2. B 更接近
3. 当前阶段 A 是表层，B 是底层
4. 都不对
```

---

## 18.4 文风方向校准

```text
下周文风方向：
A 更克制
B 更爽
C 更悬疑
D 更情绪化
E 保持当前
```

---

## 18.5 系统策略校准

```text
下周系统策略：
A 多给粗稿，少给报告
B 多给选择，但只保留 2 个非劣选项
C 暂停自动档，我想手写几章
D 加强 Canon Checker
E 加强 AI 味检测
```

Weekly Alignment 是 V3.1 的核心闭环。

---

# 19. Auto Mode 的决策压缩

自动档不能让作者审阅一堆 KPI。

必须引入：

```text
Pareto Filter
Reader Blind Test
Decision Compression
```

## 19.1 Pareto Filter

如果 B 稿在所有关键维度上都不如 A，直接淘汰。

只展示不可互相替代的选择。

例如：

```text
A：爽点强，但俗。
B：文风好，人物细腻，但节奏慢。
```

---

## 19.2 Reader Blind Test

模拟三类读者：

```text
爽文党
考据党
CP党
```

输出：

```text
谁会爽？
谁会骂？
谁会弃？
谁会催更？
```

---

## 19.3 Decision Compression

最终只给作者：

```text
推荐版本
最大风险
可替代选择
一句话理由
是否需要作者亲自介入
```

示例：

```text
推荐：A 主体 + B 的女主段落。

理由：
A 能保住追读，B 能保住人物质感。

最大风险：
A 的反派自曝太重，必须删。

是否需要你亲自介入：
只建议亲自改最后 300 字章末钩子。
```

---

# 20. Skill 体系

V3.1 不需要一开始实现所有 Skill，但需要明确职责。

## 20.1 输入层 Skills

```text
Input Triage Skill
识别输入类型、权威等级、目标范围。

Author Input Packet Skill
将各种输入统一转成输入包。

Routing Skill
决定输入进入哪个处理链路。
```

---

## 20.2 接入层 Skills

```text
Human Chapter Intake Skill
接住人工章节，不润色，只提取和分析。

Creative Intake Capsule Skill
生成 fact_delta、氛围、意图、冲突、风格、记忆补丁。

Atmospheric Triangulation Skill
生成三种氛围假设 + 证据 + 置信度。

Confidence Decay Skill
管理意图假设等级、TTL、衰减和归档。
```

---

## 20.3 记忆层 Skills

```text
Memory Patch Skill
生成记忆补丁，不直接入正史。

Canon Checker Skill
检查正史冲突。

Intentional Ambiguity Skill
记录作者有意留白，防止 AI 自动解释。

Retcon Debt Skill
记录圆场债务。
```

---

## 20.4 风格层 Skills

```text
Style Miner Skill
从作者修改和输入中提取文风候选。

Style Evolution Skill
管理 style_bible、aspirational_style、anti_style、entropy budget。

Discarded Brilliance Skill
记录废案与复活条件。

Ghost Premise Resonator Skill
扫描废案是否重新变得有价值。
```

---

## 20.5 长篇维护 Skills

```text
Context Assembler Skill
组装上下文包，不读全书。

Geological Stratification Skill
进行热层、温层、冷层、深档案管理。

Memory Hardening Skill
将已完成卷硬化为摘要、名场面锚点、氛围摘要、怪诞清单。
```

---

## 20.6 对齐层 Skills

```text
Weekly Alignment Skill
周期性回顾输入、氛围、意图、文风、AI 偏差和作者方向。

Bottleneck Finder Skill
判断当前瓶颈是设定、人物、文风、AI 味、爽点还是反馈判断。
```

---

# 21. 模型解耦

系统不能绑定任何大模型。

必须有：

```text
Model Adapter Interface
```

模型只是执行器，可以是：

```text
GPT
Claude
DeepSeek
Gemini
Codex
OpenCode
本地模型
MockModelAdapter
```

所有 AI 步骤必须通过统一接口：

```ts
interface ModelAdapter {
  name: string
  capabilities: ModelCapabilities
  generate(input: ModelInput): Promise<ModelOutput>
}

interface ModelInput {
  system: string
  instructions: string
  contextFiles: ContextFile[]
  expectedOutputSchema?: JsonSchema
  temperature?: number
  maxTokens?: number
}

interface ModelOutput {
  text: string
  structured?: unknown
  raw?: unknown
}
```

MVP 阶段可以只有 Mock Adapter。

---

# 22. 人与 AI 的分工

## 作者负责

```text
核心情绪
主角欲望
世界观方向
关键设定取舍
名场面
关键对白
人物灵魂
文风偏好
留白判断
读者反馈取舍
正史确认
最终定稿
```

---

## AI 负责

```text
输入分流
候选整理
事实提取
氛围假设
意图推断
冲突提醒
记忆补丁
废案管理
上下文组装
多稿生成
比稿压缩
AI 味检测
周期报告
```

一句话：

> **AI 负责让创作省心，作者负责让作品有魂。**

---

# 23. MVP 落地顺序

V3.1 的 MVP 不应该先做 Auto Mode。

正确顺序是：

```text
MVP-0：Creator Input Layer
MVP-1：Author Input Packet + Input Triage
MVP-2：Human Chapter Intake
MVP-3：Creative Intake Capsule
MVP-4：Atmospheric Triangulation
MVP-5：Confidence Decay Lock
MVP-6：Socratic Nudge + Retcon Debt
MVP-7：Weekly Alignment Session
MVP-8：Context Assembler 雏形
MVP-9：Style Evolution System
MVP-10：Ghost Premise Resonator
MVP-11：Geological Stratification
MVP-12：Assisted Mode
MVP-13：Auto Mode
```

第一阶段的核心验收是：

```text
作者从手机备忘录输入一条灵感，系统能识别并归档。
作者提交一章手写正文，系统能生成 Creative Intake Capsule。
系统能三角验证氛围。
系统能标注意图置信度。
系统能温和提醒冲突。
系统能生成记忆补丁但不直接入正史。
系统能生成 weekly alignment。
系统能构建下一章 context packet。
```

---

# 24. 系统不可违反的硬规则

```text
1. AI 不得直接覆盖 canon_registry.md。
2. AI 不得直接覆盖 style_bible.md。
3. AI 不得直接覆盖 final.md。
4. 未确认氛围不得进入长期正史。
5. L3 弱意图猜测不得进入 decision_log。
6. 手机备忘录输入默认不是正史，除非显式标记或作者确认。
7. human_final 默认不自动润色。
8. conflict 默认用 Socratic Nudge，不直接硬报错。
9. Auto Mode 不能自动发布。
10. Context Packet 不读取全书原文。
11. Deep Archive 默认不参与检索。
12. 所有正史变更必须通过 patch proposal。
```

---

# 25. 最终总结

Novel Driver OS V3.1 的完整定义是：

```text
一个以创作者输入层为入口，
以 Author Input Packet 统一输入，
以 Creative Intake Capsule 接住人类手稿，
以 Atmospheric Triangulation 保留氛围，
以 Confidence Decay Lock 防止错误意图固化，
以 Socratic Nudge 温和处理冲突，
以 Retcon Debt 记录圆场依赖，
以 Style Evolution 支持作者成长，
以 Ghost Premise Resonator 唤醒废案，
以 Geological Stratification 管理长篇规模，
以 Weekly Alignment Session 持续校准系统理解，
以 Context Assembler 控制上下文，
并通过 Model Adapter 与大模型解耦的
作者对齐型网文创作副驾系统。
```

它的核心不是自动生成，而是：

> **让创作者在任何地方写下的内容，都能被系统低摩擦捕获、高保真接入、谨慎解释、温和提醒、等待确认、长期记住，并在未来继续服务作者。**

最终原则：

```text
系统不约束创造。
系统只保证创造之后可以被接住、被理解、被校准、被延续。
```
