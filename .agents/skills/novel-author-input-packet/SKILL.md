---
name: novel-author-input-packet
description: 中文网文 作者输入包 技能。用于把作者灵感、正文、正稿、人设、设定、世界观、大纲、留白、文风反馈、废案、AI 稿反馈等原始输入整理成统一输入包，保留原文证据、权威等级和确认需求；不用于分析正文质量或写正史。
---

# 作者输入包

## 职责

把原始输入转为可审查、可路由、可回滚的 作者输入包。它是输入进入系统的统一接口。

## 必读

- 原始输入全文。
- `project.yaml`。
- 如已有 `triage_report`：读取分流结论；如没有，先调用或产出分流报告，不在本技能内扩展完整分流逻辑。

## 字段

必须输出：

- `input_id`
- `project`
- `source_channel`
- `source_type`
- `raw_source_path`
- `detected_type`
- `target_scope`
- `authority_level`
- `status`
- `confidence`
- `raw_text_excerpt`
- `system_interpretation`
- `requires_confirmation`
- `recommended_actions`
- `created_at`

## 工作流程

1. 原文先入 raw，不解释、不压缩成摘要。
2. 用中文解释系统判断，避免英文模板。
3. `raw_text_excerpt` 只截取证据，不改写作者措辞。
4. 多目标输入在 `target_scope` 标明主目标，并在解释里列出次级目标。
5. 对 `#不要入库` 输入设置 `status: ignored`、`requires_confirmation: false`。

## 输出

默认输出 YAML proposal。只有用户明确要求执行落盘时，才可写入 `00_inbox/triaged/`、`processed/` 或 `ignored/`。

## 禁止

- 不直接写入 `10_bible/`。
- 不把 L1 候选提升为正史。
- 不删除原始输入。

## 中文网文检查

解释要能被作者直接看懂，例如“这更像卷级大纲候选”，而不是“content plan object”。

## 自检

- 每个判断是否有原文证据？
- 状态和目录是否匹配？
- 是否保留“作者反悔权”？
- 是否给出下一步 recommended actions？
