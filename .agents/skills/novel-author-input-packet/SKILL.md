---
name: novel-author-input-packet
description: Packet / 作者输入包；用于把 raw 或 triage 后的中文网文输入封装为 CLI AuthorInputPacket，保留原文证据、权威等级、多意图和确认需求；不做质量审稿、不写正史。
disable-model-invocation: true
---

# 作者输入包

## 职责

把原始输入转为可审查、可路由、可回滚的 作者输入包。它是输入进入系统的统一接口。

## 必读

- 原始输入全文。
- `project.yaml`。
- 如已有 `triage_report`：读取分流结论；如没有，先调用或产出分流报告，不在本技能内扩展完整分流逻辑。
- `../_shared/author-facing-language-protocol.md`。
- `../_shared/canon-safety-protocol.md`。
- 当前字段必须对齐 `src/schemas.ts` 的 `AuthorInputPacketSchema`。

## 字段

必须输出：

- `input_id`
- `project`
- `source_channel`
- `source_type`
- `raw_source_path`
- `detected_type`
- `detected_intents`
- `target_scope`
- `authority_level`
- `status`
- `confidence`
- `raw_text_excerpt`
- `system_interpretation`
- `requires_confirmation`
- `recommended_actions`
- `source_actor`：`human | agent | model`
- `supersedes_input_id`：没有则为 `null`
- `created_at`

## 工作流程

1. 原文先入 raw，不解释、不压缩成摘要。
2. 用中文解释系统判断，避免英文模板。
3. `raw_text_excerpt` 只截取证据，不改写作者措辞。
4. 多意图输入必须保留 `detected_intents`；`detected_type` 只作为主路由，不吞掉次级意图。
5. 如果作者是在请求审稿，不要把审稿结论写进 packet；把请求写入 `system_interpretation` 和 `recommended_actions`。
6. 对 `#不要入库` 输入设置 `status: ignored`、`requires_confirmation: false`。

## 输出

默认输出 YAML proposal。只有用户明确要求执行落盘时，才可写入 `00_inbox/triaged/`、`processed/` 或 `ignored/`。

## 禁止

- 不直接写入 `10_bible/`。
- 不把 L1 候选提升为正史。
- 不删除原始输入。

## 中文网文检查

解释要能被作者直接看懂，例如“这更像卷级大纲候选”或“这是章节质量审稿请求，应检查主角锚定、爽点、钩子和 AI 味”，而不是“content plan object”。

## 自检

- 字段是否与 `AuthorInputPacketSchema` 完全一致，没有私自新增协议字段？
- 每个判断是否有原文证据？
- 状态和目录是否匹配？
- 是否保留“作者反悔权”？
- 是否给出下一步 recommended actions？
