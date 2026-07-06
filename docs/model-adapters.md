# Model Adapters

MVP 不绑定 OpenAI、Claude、DeepSeek、Codex、OpenCode 或任何本地模型。

接口：

```ts
interface ModelAdapter {
  name: string
  capabilities: ModelCapabilities
  generate(input: ModelInput): Promise<ModelOutput>
}
```

当前实现：

- `MockModelAdapter`
- `ModelInput`
- `ModelOutput`
- `ModelCapabilities`

约束：

- 所有 AI 输出只能是 candidate、proposal、patch、report、hypothesis。
- 模型不能直接覆盖 `canon_registry.md`。
- 模型不能直接覆盖 `style_bible.md`。
- 模型不能直接输出并覆盖 final manuscript。

