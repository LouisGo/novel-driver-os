---
name: novel-intentional-ambiguity
description: 中文网文有意留白保护技能。用于处理作者明确要求暂不解释、不要说破、先别入库、多义保留的设定、人物动机、伏笔、CP 关系或世界观信息，防止 AI 自动补全和写死。
---

# 有意留白保护

## 职责

保护作者的留白权和不解释权。系统可以提醒，但不能替作者说破。

## 必读

- 留白输入或相关正文。
- `10_bible/intentional_ambiguity.md`。
- `10_bible/open_questions.md`。
- 相关 intake 的 intention hypotheses。

## 工作流程

1. 提取作者明确要求：不解释到哪章、不写死哪个解释、哪些措辞禁用。
2. 记录 active ambiguity 候选。
3. 标注保护范围：章节、人物、设定、伏笔、读者误导。
4. 给 上下文组装器 使用的排除规则。

## 输出

输出 ambiguity proposal：

- `ambiguity_id`
- `scope`
- `protected_statement`
- `do_not_explain_before`
- `allowed_interpretations`
- `blocked_interpretations`
- `author_confirmation`

## 禁止

- 不替作者选择唯一解释。
- 不把留白转成正史设定。
- 不让自动档提前揭示。

## 中文网文检查

留白要兼顾追读：记录“读者该好奇什么”，但不要提前满足好奇。

## 自检

- 是否保留多义性？
- 是否写清楚保护到哪章或哪个阶段？
- 是否给后续上下文明确禁区？
- 是否避免把留白当 bug 修复？
