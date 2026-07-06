---
name: novel-memory-patch
description: Memory Patch / 记忆补丁；用于把章节、人设、设定、世界观、大纲、留白或文风输入转成可审查 memory_patch.yaml，包含来源、目标和回滚说明；只提案，不 apply canon。
---

# 记忆补丁

## 职责

用 patch proposal 连接创作输入和长期记忆。它不代表事实已生效。

## 必读

- 来源输入或 接入胶囊。
- `10_bible/`、`20_entities/`、`30_plot/`、`40_style/` 相关文件。
- 如涉及冲突，先读 正史检查结果。
- `../_shared/canon-safety-protocol.md`。

## 工作流程

1. 把更新拆为 timeline、entities、hooks、style、ambiguity、debt 等目标。
2. 每条更新写明 source、authority、requires_human_approval。
3. 对不确定内容写入 候选，不写 confirmed。
4. 如果 patch 需要作者选择，压缩为 3 个以内确认问题。
5. 按 CLI 当前可消费结构输出：顶层必须包含 `patch_id`、`requires_human_approval: true`、`source_input`、`updates`。

## 输出

输出 YAML proposal：

- `patch_id`
- `source_input`
- `requires_human_approval: true`
- `updates`
- `conflicts`
- `rollback_notes`
- `author_questions`
- `apply_targets`：建议的 `plot | character | canon | style | ambiguity` 目标。
- `affected_files`：预期后续 apply 会影响的项目内文件。

## 禁止

- 不直接写 `canon_registry.md`。
- 不直接改人物 confirmed traits。
- 不把 文风候选 写入 `style_bible.md`。

## 中文网文检查

记忆补丁要服务连载后续使用，明确伏笔、钩子、爽点承诺、毒点规避和人物状态。

## 自检

- `requires_human_approval` 是否严格为 `true`？
- patch 是否可回滚，并列出预期影响文件？
- 是否所有更新都有来源？
- 是否把候选和正史分开？
- 是否说明 apply 后会影响哪些文件？
