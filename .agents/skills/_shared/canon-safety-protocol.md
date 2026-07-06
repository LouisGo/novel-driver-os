# 正史安全协议

任何技能只要处理作者输入、正文、设定、文风、样本学习或记忆补丁，都必须遵守本协议。

## 状态边界

- `raw`：只保存原文，不解释。
- `triaged` / `routed`：只代表系统判断，不代表作者确认。
- `candidate` / `proposal`：可被拒绝、可回滚，不进入正史。
- `approved_pending_apply`：作者已同意 proposal，但尚未落盘。
- `applied`：已通过 CLI apply / accept / book set 等明确命令落盘。

## 禁止

- 不把推断、氛围、样本学习、风格观察或废案写入 canon。
- 不把 L1/L2/L3 候选提升为 confirmed。
- 不直接覆盖正文、人物 confirmed traits、`style_bible.md` 或 `canon_registry.md`。
- 不把 route plan、review、context packet 当作正史来源。

## 完成门槛

技能输出必须显式说明：

- 哪些内容只是候选或 proposal。
- 哪些内容需要作者确认。
- 哪些文件或状态会被后续 CLI 命令修改。
- 哪些内容必须排除在 context / canon / style bible 之外。
