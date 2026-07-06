---
name: novel-memory-patch
description: 中文网文记忆补丁技能。用于把正文、人设、设定、世界观、大纲、伏笔、留白、风格反馈或作者确认转成可审查 memory_patch 提案，并生成 apply/reject 建议；不得直接修改正史文件。
---

# 记忆补丁

## 职责

用 patch proposal 连接创作输入和长期记忆。它不代表事实已生效。

## 必读

- 来源输入或 接入胶囊。
- `10_bible/`、`20_entities/`、`30_plot/`、`40_style/` 相关文件。
- 如涉及冲突，先读 正史检查结果。

## 工作流程

1. 把更新拆为 timeline、entities、hooks、style、ambiguity、debt 等目标。
2. 每条更新写明 source、authority、requires_human_approval。
3. 对不确定内容写入 候选，不写 confirmed。
4. 如果 patch 需要作者选择，压缩为 3 个以内确认问题。

## 输出

输出 YAML proposal：

- `patch_id`
- `source_input`
- `requires_human_approval: true`
- `updates`
- `conflicts`
- `rollback_notes`
- `author_questions`

## 禁止

- 不直接写 `canon_registry.md`。
- 不直接改人物 confirmed traits。
- 不把 文风候选 写入 `style_bible.md`。

## 中文网文检查

记忆补丁要服务连载后续使用，明确伏笔、钩子、爽点承诺、毒点规避和人物状态。

## 自检

- patch 是否可回滚？
- 是否所有更新都有来源？
- 是否把候选和正史分开？
- 是否说明 apply 后会影响哪些文件？
