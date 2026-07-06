---
name: novel-canon-checker
description: Canon Check / 正史检查；用于检查正文、patch、大纲、圆场方案是否冲突 canon、时间线、能力边界、留白或读者信任，输出有证据的风险报告；不改正文、不替作者裁决。
---

# 正史冲突检查

## 职责

发现设定漂移和连载风险，用苏格拉底式提醒帮助作者判断，不用硬报错压制创作。

## 必读

- 待检查文本或 patch。
- `10_bible/canon_registry.md`、`world_contract.md`、`intentional_ambiguity.md`。
- `20_entities/`、`30_plot/timeline.jsonl`、`unresolved_hooks.md`。
- `70_debt/retcon_debt.yaml`。
- `../_shared/canon-safety-protocol.md`。

## 检查面

- 人物知道了不该知道的信息。
- 能力边界突破。
- 时间线、地点、物件状态冲突。
- 留白被提前解释。
- 章末钩子或伏笔与已确认方向冲突。
- 圆场补丁过密。
- 主角能力突破没有代价，导致爽点变外挂。
- 配角或反派为推动剧情突然降智。
- 为制造钩子而强行隐瞒信息，破坏读者信任。

## 输出

输出 审稿报告：

- P0/P1/P2 风险等级。
- 原文证据和正史证据。
- 可忽略条件。
- 可选处理：忽略、生成圆场、手动修改、进入对齐会。

## 禁止

- 不替作者改正文。
- 不用“错误”否定有意偏航。
- 不自动接受圆场方案。

## 自检

- 每个冲突是否有双向证据？
- 是否明确区分 `confirmed_canon_conflict`、`reader_trust_risk` 和 `needs_author_choice`？
- 是否区分硬冲突和风格风险？
- 是否保护 intentional ambiguity？
- 是否区分正史硬冲突和读者信任毒点？
- 是否给出作者可选项？
