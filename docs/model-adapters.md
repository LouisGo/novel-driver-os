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

V1 Codex 手动挡中，模型生成由 agent 发起。CLI 不直接调用 GPT、DeepSeek 或 Gemini；agent/model 产物必须先作为 Author Input Packet、memory patch proposal、storycraft artifact、chapter variant 或 report 进入文件协议。

约束：

- 所有 AI 输出只能是 candidate、proposal、patch、report、hypothesis。
- 模型不能直接覆盖 `canon_registry.md`。
- 模型不能直接覆盖 `style_bible.md`。
- 模型不能直接输出并覆盖 final manuscript。
