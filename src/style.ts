import path from "node:path";
import { appendText, pathExists, readText, writeText } from "./fs-utils.js";
import { findPacket } from "./input.js";
import { projectRoot } from "./paths.js";
import { nowIso } from "./time.js";
import { appendDiscardedBrillianceCandidate } from "./discarded.js";
import { appendTrace } from "./trace.js";

export async function createStyleCandidate(projectName: string, inputId: string): Promise<string> {
  const root = projectRoot(projectName);
  const { packet } = await findPacket(projectName, inputId);
  const rawPath = path.join(root, packet.raw_source_path);
  const rawText = await readText(rawPath);
  const block = `## Candidate ${inputId}

created_at: ${nowIso()}
source_type: ${packet.detected_type}
authority_level: ${packet.authority_level}
status: candidate_only

观察：
- 该输入可能包含作者对节奏、潜台词、人物表达或叙事密度的偏好。
- 不能直接写入 style_bible，需要 Weekly Alignment 或作者确认。

证据：
> ${rawText.trim().slice(0, 260).replace(/\n/g, "\n> ")}

`;

  const projectStylePath = path.join(root, "40_style/style_candidates.md");
  if (!(await pathExists(projectStylePath))) {
    await writeText(projectStylePath, "# Style Candidates\n\n");
  }
  await appendText(projectStylePath, block);

  const intakeCandidatePath = path.join(root, "01_intake", inputId, "style_candidates.md");
  if (await pathExists(path.dirname(intakeCandidatePath))) {
    await appendText(intakeCandidatePath, `\n${block}`);
  }

  if (packet.detected_type === "discarded_idea") {
    await appendDiscardedBrillianceCandidate(projectName, inputId, rawText);
  }

  await appendTrace(projectName, {
    command: "style.candidate",
    input_id: inputId,
    artifacts: ["40_style/style_candidates.md"],
    metadata: { source_type: packet.detected_type },
  });
  return projectStylePath;
}
