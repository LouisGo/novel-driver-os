import path from "node:path";
import { appendText, readText } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { nowIso } from "./time.js";

export async function appendDiscardedBrillianceCandidate(projectName: string, inputId: string, rawText: string): Promise<void> {
  const filePath = path.join(projectRoot(projectName), "40_style/discarded_brilliance.md");
  const existing = await readText(filePath);
  if (existing.includes(`## ${inputId}`)) return;

  const block = `
## ${inputId}

\`\`\`yaml
id: ${inputId}
created_at: ${nowIso()}
original_context: author_input
idea: ${JSON.stringify(rawText.trim().slice(0, 180))}
discarded_reason: "作者标记为废案或系统识别为被舍弃灵感。"
latent_value: "未来可能在剧情、人物或氛围条件变化后复活。"
resurrection_triggers:
  - "同类主题再次出现"
  - "相关角色状态反转"
suggested_future_use:
  - "作为候选桥段，不直接写入正史。"
\`\`\`
`;
  await appendText(filePath, block);
}
