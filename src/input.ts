import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import YAML from "yaml";
import {
  AuthorInputPacket,
  AuthorInputPacketSchema,
  InputStatus,
  InputType,
} from "./schemas.js";
import {
  copyFile,
  ensureDir,
  listFilesRecursive,
  pathExists,
  readText,
  readYaml,
  writeYaml,
} from "./fs-utils.js";
import { projectRoot, relativeToProject, safeName } from "./paths.js";
import { compactTimestamp, nowIso } from "./time.js";
import { appendDiscardedBrillianceCandidate } from "./discarded.js";

export interface PacketLocation {
  packet: AuthorInputPacket;
  path: string;
}

const TAG_RE = /(^|\s)#([\p{L}\p{N}_-]+)/gu;

export async function ingestInput(projectName: string, filePath: string): Promise<AuthorInputPacket> {
  const root = projectRoot(projectName);
  if (!(await pathExists(path.join(root, "project.yaml")))) {
    throw new Error(`Project not found: ${projectName}`);
  }

  const absoluteSource = path.resolve(filePath);
  const rawText = await readText(absoluteSource);
  const inputId = createInputId(rawText);
  const rawName = `${inputId}_${safeName(path.basename(filePath)) || "input.md"}`;
  const rawTarget = path.join(root, "00_inbox/raw", rawName);
  await copyFile(absoluteSource, rawTarget);

  const packet = buildAuthorInputPacket(projectName, rawText, rawTarget, inputId);
  const packetDir = packet.status === "ignored" ? "ignored" : "triaged";
  await writeYaml(path.join(root, "00_inbox", packetDir, `${inputId}.yaml`), packet);
  if (packet.detected_type === "discarded_idea" && packet.status !== "ignored") {
    await appendDiscardedBrillianceCandidate(projectName, inputId, rawText);
  }
  return packet;
}

export async function listInputs(projectName: string): Promise<AuthorInputPacket[]> {
  const packets = await listPacketLocations(projectName);
  return packets
    .map((entry) => entry.packet)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function findPacket(projectName: string, inputId: string): Promise<PacketLocation> {
  const packets = await listPacketLocations(projectName);
  const found = packets.find((entry) => entry.packet.input_id === inputId);
  if (!found) {
    throw new Error(`Input packet not found: ${inputId}`);
  }
  return found;
}

export async function updatePacket(
  projectName: string,
  packet: AuthorInputPacket,
  nextBucket?: "triaged" | "processed" | "ignored",
): Promise<string> {
  const existing = await listPacketLocations(projectName);
  for (const entry of existing.filter((item) => item.packet.input_id === packet.input_id)) {
    await fs.rm(entry.path, { force: true });
  }
  const bucket = nextBucket ?? bucketForStatus(packet.status);
  const target = path.join(projectRoot(projectName), "00_inbox", bucket, `${packet.input_id}.yaml`);
  await writeYaml(target, packet);
  return target;
}

export async function ignoreInput(projectName: string, inputId: string): Promise<AuthorInputPacket> {
  const { packet } = await findPacket(projectName, inputId);
  const next = { ...packet, status: "ignored" as InputStatus, requires_confirmation: false };
  await updatePacket(projectName, next, "ignored");
  return next;
}

export function reviewPacket(packet: AuthorInputPacket): string {
  return YAML.stringify(packet, { lineWidth: 0 });
}

export function buildAuthorInputPacket(
  projectName: string,
  rawText: string,
  rawTargetPath: string,
  inputId = createInputId(rawText),
): AuthorInputPacket {
  const tags = extractTags(rawText);
  const detectedType = detectType(rawText, tags);
  const chapter = detectChapter(tags, rawText);
  const entity = detectEntity(tags, rawText);
  const authorityLevel = detectAuthority(tags, detectedType);
  const status: InputStatus = tags.has("不要入库") ? "ignored" : "triaged";
  const confidence = confidenceFor(tags, detectedType);
  const requiresConfirmation = status !== "ignored" && authorityLevel !== "L0_transient";
  const packet: AuthorInputPacket = {
    input_id: inputId,
    project: projectName,
    source_channel: "file",
    source_type: "human",
    raw_source_path: relativeToProject(projectName, rawTargetPath),
    detected_type: detectedType,
    target_scope: {
      entity,
      chapter,
      volume: null,
    },
    authority_level: authorityLevel,
    status,
    confidence,
    raw_text_excerpt: excerpt(rawText),
    system_interpretation: interpretationsFor(detectedType, entity, chapter),
    requires_confirmation: requiresConfirmation,
    recommended_actions: recommendedActionsFor(detectedType, authorityLevel, status),
    created_at: nowIso(),
  };
  return AuthorInputPacketSchema.parse(packet);
}

export function extractTags(rawText: string): Set<string> {
  const tags = new Set<string>();
  for (const match of rawText.matchAll(TAG_RE)) {
    tags.add(match[2]);
  }
  return tags;
}

export function normalizeChapter(chapter: string): string {
  const match = chapter.match(/^ch[_-]?(\d+)$/i);
  if (!match) return chapter;
  return `ch${match[1].padStart(4, "0")}`;
}

async function listPacketLocations(projectName: string): Promise<PacketLocation[]> {
  const root = projectRoot(projectName);
  const dirs = ["triaged", "processed", "ignored"].map((dir) => path.join(root, "00_inbox", dir));
  const packetFiles: string[] = [];
  for (const dir of dirs) {
    packetFiles.push(...(await listFilesRecursive(dir)).filter((file) => file.endsWith(".yaml") || file.endsWith(".yml")));
  }
  const packets: PacketLocation[] = [];
  for (const file of packetFiles) {
    try {
      const parsed = AuthorInputPacketSchema.parse(await readYaml(file));
      packets.push({ packet: parsed, path: file });
    } catch {
      // Validation reports malformed packets; list commands skip unreadable packets.
    }
  }
  return packets;
}

function createInputId(rawText: string): string {
  const hash = createHash("sha1").update(`${rawText}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 8);
  return `input_${compactTimestamp()}_${hash}`;
}

function bucketForStatus(status: InputStatus): "triaged" | "processed" | "ignored" {
  if (status === "ignored" || status === "archived") return "ignored";
  if (["processed", "pending_confirmation", "applied"].includes(status)) return "processed";
  return "triaged";
}

function detectType(rawText: string, tags: Set<string>): InputType {
  if (tags.has("废案")) return "discarded_idea";
  if (tags.has("反馈")) return "feedback";
  if (tags.has("文风")) return "style_feedback";
  if (tags.has("留白")) return "ambiguity";
  if (tags.has("人设") || tags.has("女主") || tags.has("男主") || tags.has("主角")) return "character";
  if (tags.has("世界观")) return "worldbuilding";
  if (tags.has("设定")) return "setting";
  if (tags.has("正文")) return rawText.length > 160 || detectChapter(tags, rawText) ? "chapter" : "fragment";
  if (tags.has("灵感")) return "inspiration";

  if (/废案|舍弃|不要用/.test(rawText)) return "discarded_idea";
  if (/文风|语气|笔触|AI味/.test(rawText)) return "style_feedback";
  if (/留白|暂时不要解释|不要说破/.test(rawText)) return "ambiguity";
  if (/女主|男主|主角|人设|角色/.test(rawText)) return "character";
  if (/世界|宗门|王朝|规则|能力|设定/.test(rawText)) return "setting";
  if (/“[^”]+”/.test(rawText) && rawText.length > 40) return "fragment";
  return "unknown";
}

function detectChapter(tags: Set<string>, rawText: string): string | null {
  for (const tag of tags) {
    if (/^ch[_-]?\d+$/i.test(tag)) return normalizeChapter(tag);
  }
  const match = rawText.match(/(?:^|\s)#?(ch[_-]?\d+)/i);
  return match ? normalizeChapter(match[1]) : null;
}

function detectEntity(tags: Set<string>, rawText: string): string | null {
  if (tags.has("女主") || /女主/.test(rawText)) return "heroine";
  if (tags.has("男主") || tags.has("主角") || /男主|主角/.test(rawText)) return "protagonist";
  for (const tag of tags) {
    if (tag.startsWith("char_")) return tag.slice(5);
  }
  return null;
}

function detectAuthority(tags: Set<string>, type: InputType): string {
  if (tags.has("正史")) return "L5_author_confirmed_canon_candidate";
  if (tags.has("正稿")) return "L5_author_final_draft";
  if (tags.has("正文")) return "L4_author_written_text";
  if (tags.has("候选")) return "L1_candidate";
  if (tags.has("暂存")) return "L0_transient";
  if (tags.has("不要入库")) return "L0_transient";
  if (type === "chapter" || type === "fragment") return "L4_author_written_text";
  return "L1_candidate";
}

function confidenceFor(tags: Set<string>, type: InputType): number {
  let confidence = type === "unknown" ? 0.34 : 0.62;
  if (tags.size > 0) confidence += 0.16;
  if (tags.has("正文") || tags.has("人设") || tags.has("文风") || tags.has("废案")) confidence += 0.1;
  if (tags.has("候选") || tags.has("正稿") || tags.has("正史")) confidence += 0.08;
  return Math.min(0.95, Number(confidence.toFixed(2)));
}

function interpretationsFor(type: InputType, entity: string | null, chapter: string | null): string[] {
  const target = entity ? `目标实体可能是 ${entity}。` : "暂未识别到明确目标实体。";
  const chapterText = chapter ? `目标章节可能是 ${chapter}。` : "暂未识别到明确章节。";
  const common = [target, chapterText, "该输入不会直接写入正史，只会作为候选、proposal 或 intake 来源。"];
  const byType: Record<InputType, string> = {
    inspiration: "这更像一条灵感碎片，适合进入候选池或 open_questions。",
    chapter: "这更像作者亲写章节，适合进入 Human Chapter Intake。",
    fragment: "这更像正文片段，适合进入 Human Chapter Intake 但需要作者确认范围。",
    setting: "这更像设定想法，适合生成 memory patch proposal。",
    character: "这更像人设候选，尤其不能直接写入角色正史。",
    worldbuilding: "这更像世界观想法，适合与 world_contract 对齐。",
    ambiguity: "这更像有意留白，应保护为 intentional ambiguity。",
    style_feedback: "这更像文风反馈，适合进入 style candidate。",
    discarded_idea: "这更像废案或被舍弃灵感，应进入 discarded brilliance 候选。",
    feedback: "这更像作者对 AI 稿或系统理解的反馈，适合进入 alignment。",
    unknown: "系统无法稳定判断输入类型，需要作者确认。",
  };
  return [byType[type], ...common];
}

function recommendedActionsFor(type: InputType, authority: string, status: InputStatus): string[] {
  if (status === "ignored") return ["keep_raw_only", "do_not_route"];
  const actions: Record<InputType, string[]> = {
    inspiration: ["add_to_inspiration_candidates", "review_in_weekly_alignment"],
    chapter: ["run_human_chapter_intake", "generate_creative_intake_capsule"],
    fragment: ["run_human_chapter_intake", "ask_author_for_scope"],
    setting: ["generate_memory_patch_candidate", "ask_author_confirmation"],
    character: ["add_to_character_candidates", "ask_author_confirmation"],
    worldbuilding: ["generate_world_contract_patch_candidate", "ask_author_confirmation"],
    ambiguity: ["add_to_intentional_ambiguity_candidate", "protect_from_auto_explanation"],
    style_feedback: ["generate_style_candidate", "review_in_weekly_alignment"],
    discarded_idea: ["append_discarded_brilliance_candidate", "record_resurrection_triggers"],
    feedback: ["review_alignment_feedback", "adjust_system_interpretation"],
    unknown: ["manual_review_required"],
  };
  return [...actions[type], authority.includes("L5") ? "treat_as_high_authority_input" : "do_not_apply_to_canon_directly"];
}

function excerpt(rawText: string): string {
  return rawText.replace(/\r\n/g, "\n").trim().slice(0, 500);
}
