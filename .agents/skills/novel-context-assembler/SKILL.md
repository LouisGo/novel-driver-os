---
name: novel-context-assembler
description: 中文网文上下文组装技能。用于为下一章、桥段候选、章节质量审稿、自动档或辅助档构建安全 context packet，选择项目状态、人物、势力、地点、物件、时间线、风格、留白、债务、废案提醒和近期章节审稿结论；不读取全书原文。
---

# 上下文组装

## 职责

给下一步任务提供足够上下文，同时避免全书灌入、弱猜测污染和过期草稿干扰。

## 必读

- 目标任务和目标章节。
- `project.yaml`、`10_bible/`、相关 `20_entities/`、`30_plot/`、`40_style/`、`70_debt/`。
- 选择规则详见 `references/context-selection.md`。
- 若目标是写作或审稿，加入近期 `chapter_quality_review`、`60_alignment/` 里的质量趋势和下一章 must-fix。

## 工作流程

1. 明确任务：写作、审稿、对齐、补丁、风格还是硬化。
2. 选择相关实体：人物、势力、地点、物件都要纳入候选。
3. 读取 confirmed vibes；tentative vibes 只在 TTL 内短期加入。
4. 加入 intentional ambiguity 禁区和 retcon debt 风险。
5. 加入最近 1-3 章的审稿硬门槛、低分维度和已确认的作者取舍，避免下一章重复问题。
6. 输出 context packet，不执行创作任务。

## 输出

输出上下文包，必须显式列出 `included` 和 `excluded`：

- `included`：项目简报、正史与留白、相关实体、时间线与钩子、文风约束、质量审稿趋势、债务与废案提醒。
- `excluded`：全书正文、深档案、过期弱猜测、无关草稿。

## 禁止

- 不默认读取全书正文。
- 不读取 深档案。
- 不加入过期 L3 弱猜测。
- 不把 context packet 当正史。

## 自检

- 是否包含必要但不过量的上下文？
- 是否漏掉地点、物件、势力？
- 如用于审稿或写作，是否包含最近章节质量问题和下一章 must-fix？
- 是否标记排除项？
- 是否能直接支撑下一步任务？
