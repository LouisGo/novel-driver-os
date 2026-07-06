export interface ContextFile {
  path: string;
  content: string;
}

export interface ModelCapabilities {
  structuredOutput: boolean;
  maxContextTokens?: number;
  notes: string[];
}

export interface ModelInput {
  system: string;
  instructions: string;
  contextFiles: ContextFile[];
  expectedOutputSchema?: unknown;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelOutput {
  text: string;
  structured?: unknown;
  raw?: unknown;
}

export interface ModelAdapter {
  name: string;
  capabilities: ModelCapabilities;
  generate(input: ModelInput): Promise<ModelOutput>;
}

export class MockModelAdapter implements ModelAdapter {
  name = "mock";

  capabilities: ModelCapabilities = {
    structuredOutput: true,
    maxContextTokens: 16000,
    notes: ["MVP mock adapter; never writes canon directly."],
  };

  async generate(input: ModelInput): Promise<ModelOutput> {
    return {
      text: `Mock response for: ${input.instructions.slice(0, 120)}`,
      structured: {
        adapter: this.name,
        context_files: input.contextFiles.map((file) => file.path),
      },
      raw: input,
    };
  }
}
