---
name: novel-retcon-debt
description: 中文网文圆场债务技能。用于记录作者接受的圆场补丁、设定偏移、连续性修补和追读风险，评估过去章节的圆场依赖是否过高；不自动圆场、不强迫改稿。
---

# 圆场债务

## 职责

让圆场成为可见债务，防止系统把连续性问题越补越乱。

## 必读

- 冲突报告或作者接受的圆场方案。
- `70_debt/retcon_debt.yaml`。
- 相关 `10_bible/`、`30_plot/`。

## 工作流程

1. 判断是否属于 continuity patch、motivation patch、world-rule patch 或 pacing patch。
2. 记录 issue、accepted_solution、chapter、severity。
3. 统计当前卷和最近 10 章债务。
4. 超阈值时建议暂停自动圆场，进入作者对齐。

## 严重度标尺

- `low`：小连续性修补，不改变人物动机或世界规则。
- `medium`：影响读者理解、关系线可信度或局部设定边界。
- `high`：改变核心规则、关键人物选择或本卷主线因果。

默认阈值：最近 10 章内圆场债务达到 3 条时，必须建议进入周期作者对齐。

## 输出

输出 债务条目或报告：

- `chapter`
- `issue`
- `accepted_solution`
- `debt_type`
- `severity`
- `future_risk`
- `suggested_alignment_question`

## 禁止

- 不替作者接受圆场。
- 不把圆场方案自动写回正史。
- 不把所有冲突都圆成“伏笔”。

## 自检

- 是否只有作者接受后才入账？
- severity 是否合理？
- 是否提示累积风险？
- 是否给出下一步对齐问题？
