---
name: novel-premise-alchemy
description: Premise Alchemy / 题材炼金；用于从灵感、题材、书名简介、世界观、大纲或现实情绪中提炼一句话卖点、类型碰撞、新意包装和读者承诺；不写正文、不落正史。
---

# 题材炼金

## 职责

把“我有个想法”炼成可检验的故事卖点。它处理题材、母题、现实情绪和类型碰撞，不负责写正文或确认 canon。

## 必读

- 作者原始灵感、题材偏好、禁区和目标读者。
- `project.yaml`、`10_bible/book_profile.yaml`、已有大纲或世界观输入。
- `../_shared/author-facing-language-protocol.md`。
- `../_shared/commercial-storycraft-protocol.md`。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 先抽出熟悉母题：升级、复仇、逆袭、求生、争霸、探案、亲情、师徒、群像、末日、职场、历史、神话等。
2. 再加入陌生变量：题材碰撞、职业反差、特殊规则、现实情绪、时代焦虑、伦理困境、意外代价。
3. 生成 3 个以内 premise candidates，每个都用一句话说明“谁，在什么不公或压力下，用什么特殊方式追求什么”。
4. 对每个候选检查 `freshness_hook`、读者承诺、长期扩展空间、可能毒点和工业味风险。
5. 明确哪些只是灵感候选，哪些可以进入 book_profile proposal。

## 输出

面向作者时输出“创作方向草案”，不要把 `premise_alchemy_report` 当标题。必须使用作者态结构：

- `【类型】创作方向草案`
- `【状态】未确认`
- `【入库】不会写入正史资料，需要你确认后才可进入长期资料`
- `【用途】用于选择新书卖点、题材碰撞和后续爽点设计`
- `【一句话锚点】`：先给推荐方向的一句话判断。
- `【方向一】` / `【方向二】` / `【方向三】`：最多 3 个方向，每个方向必须包含 `【故事卖点】`、`【熟悉点】`、`【新鲜点】`、`【主角压力】`、`【追读点】`、`【风险】`。
- `【推荐方向】`：只推荐一个，并说明为什么它最适合长篇。
- `【需要你确认】`：列出不超过 5 个会改变后续写法的开关。
- `【下一步】`：指向爽点设计、世界观草案或书名简介确认。

内部登记时可保存以下字段：

- `source_input_id`
- `core_mother_trope`
- `freshness_vectors`
- `premise_candidates`
- `reader_promise`
- `human_need`
- `genre_collision`
- `topical_resonance`
- `longform_engine`
- `risks`
- `recommended_candidate`
- `author_questions`
- `next_commands`

每个 `premise_candidate` 必须包含：

- `one_sentence_hook`
- `why_familiar`
- `why_fresh`
- `main_character_pressure`
- `value_at_stake`
- `serial_potential`
- `industrial_risk`

## 禁止

- 不把“像某某作品”当卖点。
- 不为了新奇牺牲主角、目标和读者理解。
- 不写正文。
- 不把候选题材写入正史。

## 自检

- 一句话卖点是否具体到人物压力和价值冲突？
- 是否有熟悉母题与陌生变量的碰撞？
- 是否说明读者为什么愿意追？
- 是否避免掉书袋和概念堆砌？
- 是否给出下一步可进入 `novel-payoff-architecture` 或 book profile proposal 的命令？
