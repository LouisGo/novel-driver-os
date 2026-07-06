import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  AuthorInputPacket,
  AuthorInputPacketSchema,
  InputStatus,
  InputType,
} from "./schemas.js";
import {
  ensureDir,
  listFilesRecursive,
  pathExists,
  readText,
  readYaml,
  writeText,
  writeYaml,
} from "./fs-utils.js";
import { projectRoot, relativeToProject, safeName } from "./paths.js";
import { compactTimestamp, nowIso } from "./time.js";
import { appendDiscardedBrillianceCandidate } from "./discarded.js";
import { appendTrace } from "./trace.js";
import { inputStatusLabel, inputTypeLabel } from "./display.js";

export interface PacketLocation {
  packet: AuthorInputPacket;
  path: string;
}

const TAG_RE = /(^|\s)#([\p{L}\p{N}_-]+)/gu;
export type SourceActor = "human" | "agent" | "model";

export interface IngestOptions {
  sourceActor?: SourceActor;
  supersedesInputId?: string | null;
  sourceChannel?: string;
  rawNameHint?: string;
}

export async function ingestInput(projectName: string, filePath: string, options: IngestOptions = {}): Promise<AuthorInputPacket> {
  const root = projectRoot(projectName);
  if (!(await pathExists(path.join(root, "project.yaml")))) {
    throw new Error(`Project not found: ${projectName}`);
  }

  const absoluteSource = path.resolve(filePath);
  const rawText = await readText(absoluteSource);
  return ingestText(projectName, rawText, {
    ...options,
    sourceChannel: options.sourceChannel ?? "file",
    rawNameHint: options.rawNameHint ?? path.basename(filePath),
  });
}

export async function ingestText(projectName: string, rawText: string, options: IngestOptions = {}): Promise<AuthorInputPacket> {
  const root = projectRoot(projectName);
  if (!(await pathExists(path.join(root, "project.yaml")))) {
    throw new Error(`Project not found: ${projectName}`);
  }

  const inputId = createInputId(rawText);
  const rawName = `${inputId}_${safeName(options.rawNameHint ?? "stdin.md") || "input.md"}`;
  const rawTarget = path.join(root, "00_inbox/raw", rawName);
  await writeText(rawTarget, rawText);

  const packet = buildAuthorInputPacket(projectName, rawText, rawTarget, inputId, {
    sourceActor: options.sourceActor,
    sourceChannel: options.sourceChannel,
    supersedesInputId: options.supersedesInputId,
  });
  const packetDir = packet.status === "ignored" ? "ignored" : "triaged";
  await writeYaml(path.join(root, "00_inbox", packetDir, `${inputId}.yaml`), packet);
  if (packet.detected_type === "discarded_idea" && packet.status !== "ignored") {
    await appendDiscardedBrillianceCandidate(projectName, inputId, rawText);
  }
  await appendTrace(projectName, {
    command: "ingest",
    input_id: inputId,
    from_status: "raw",
    to_status: packet.status,
    artifacts: [
      relativeToProject(projectName, rawTarget),
      `00_inbox/${packetDir}/${inputId}.yaml`,
    ],
    metadata: {
      detected_type: packet.detected_type,
      detected_intents: packet.detected_intents,
      authority_level: packet.authority_level,
      source_actor: packet.source_actor,
    },
  });
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
  await appendTrace(projectName, {
    command: "ignore-input",
    input_id: inputId,
    from_status: packet.status,
    to_status: "ignored",
    artifacts: [`00_inbox/ignored/${inputId}.yaml`],
  });
  return next;
}

export function reviewPacket(packet: AuthorInputPacket): string {
  const lines = [
    `输入编号：${packet.input_id}`,
    `分类：${inputTypeLabel(packet.detected_type)}`,
    `状态：${inputStatusLabel(packet.status)}`,
    `是否需要确认：${packet.requires_confirmation ? "需要" : "不需要"}`,
    `原文位置：${packet.raw_source_path}`,
    "",
    "系统理解：",
    ...packet.system_interpretation.map((item) => `- ${item}`),
    "",
    "建议下一步：",
    ...packet.recommended_actions.map((item) => `- ${item}`),
  ];
  return lines.join("\n");
}

export function buildAuthorInputPacket(
  projectName: string,
  rawText: string,
  rawTargetPath: string,
  inputId = createInputId(rawText),
  options: IngestOptions = {},
): AuthorInputPacket {
  const tags = extractTags(rawText);
  const detectedIntents = detectIntents(rawText, tags);
  const detectedType = detectedIntents[0] ?? "unknown";
  const chapter = detectChapter(tags, rawText);
  const entity = detectEntity(tags, rawText);
  const authorityLevel = detectAuthority(tags, detectedType);
  const status: InputStatus = tags.has("不要入库") ? "ignored" : "triaged";
  const confidence = confidenceFor(tags, detectedType);
  const requiresConfirmation = status !== "ignored" && authorityLevel !== "L0_transient";
  const packet: AuthorInputPacket = {
    input_id: inputId,
    project: projectName,
    source_channel: options.sourceChannel ?? "file",
    source_type: options.sourceActor ?? "human",
    raw_source_path: relativeToProject(projectName, rawTargetPath),
    detected_type: detectedType,
    detected_intents: detectedIntents,
    target_scope: {
      entity,
      chapter,
      volume: null,
    },
    authority_level: authorityLevel,
    status,
    confidence,
    raw_text_excerpt: excerpt(rawText),
    system_interpretation: interpretationsFor(detectedType, entity, chapter, detectedIntents),
    requires_confirmation: requiresConfirmation,
    recommended_actions: recommendedActionsFor(detectedType, authorityLevel, status),
    source_actor: options.sourceActor ?? "human",
    supersedes_input_id: options.supersedesInputId ?? null,
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
  if (["processed", "pending_confirmation", "approved_pending_apply", "applied"].includes(status)) return "processed";
  return "triaged";
}

function detectIntents(rawText: string, tags: Set<string>): InputType[] {
  const intents: InputType[] = [];
  const add = (type: InputType) => {
    if (!intents.includes(type)) intents.push(type);
  };

  if (tags.has("废案")) add("discarded_idea");
  if (tags.has("变体") || tags.has("版本")) add("chapter_variant");
  if (tags.has("重写") || tags.has("改写") || tags.has("比稿")) add("rewrite_request");
  if (tags.has("书名") || tags.has("简介") || tags.has("小说简介")) add("book_profile");
  if (tags.has("样本") || tags.has("学习") || tags.has("投喂") || tags.has("参考")) add("learning_sample");
  if (tags.has("正文")) add(rawText.length > 160 || detectChapter(tags, rawText) ? "chapter" : "fragment");
  if (tags.has("文风")) add("style_feedback");
  if (tags.has("留白")) add("ambiguity");
  if (tags.has("人设") || tags.has("女主") || tags.has("男主") || tags.has("主角")) add("character");
  if (tags.has("世界观")) add("worldbuilding");
  if (tags.has("大纲")) add("outline");
  if (tags.has("设定")) add("setting");
  if (tags.has("灵感")) add("inspiration");
  if (tags.has("反馈")) add("feedback");

  if (/废案|舍弃|不要用/.test(rawText)) add("discarded_idea");
  if (/重写|改写|比稿|另写[一二三四五六七八九十\d]+版|多个版本|N\s*个版本/i.test(rawText)) add("rewrite_request");
  if (/书名|小说名|简介|一句话简介|作品简介|文案/.test(rawText)) add("book_profile");
  if (/投喂|学习这个|学习这段|写得好|优秀样本|参考样本|消化.*吸收|我想学/.test(rawText)) add("learning_sample");
  if (/文风|语气|笔触|AI味/.test(rawText)) add("style_feedback");
  if (/留白|暂时不要解释|不要说破/.test(rawText)) add("ambiguity");
  if (/第一卷|卷目标|大纲|章节规划|剧情编排|剧情走向/.test(rawText)) add("outline");
  if (/女主|男主|主角|人设|角色/.test(rawText)) add("character");
  if (/世界观|世界|宗门|王朝|九炉域|地图|城邦/.test(rawText)) add("worldbuilding");
  if (/规则|能力|修炼体系|境界|设定/.test(rawText)) add("setting");
  if (/反馈|不满意|误解|纠偏/.test(rawText)) add("feedback");
  if (/“[^”]+”/.test(rawText) && rawText.length > 40) add("fragment");

  return intents.length > 0 ? intents : ["unknown"];
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

function interpretationsFor(type: InputType, entity: string | null, chapter: string | null, intents: InputType[] = [type]): string[] {
  const target = entity ? `可能关联的人物或对象：${entity}。` : "暂未识别到明确人物或对象。";
  const chapterText = chapter ? `目标章节可能是 ${chapter}。` : "暂未识别到明确章节。";
  const common = [`识别到的输入分类：${intents.map(inputTypeLabel).join("、")}。`, target, chapterText, "这条输入不会直接写入正史资料，只会先作为草案、待确认提案或后续处理来源。"];
  const byType: Record<InputType, string> = {
    inspiration: "这更像一条灵感碎片，适合进入候选池或 open_questions。",
    chapter: "这更像作者亲写章节，适合先提取事实、人物变化和后续风险。",
    fragment: "这更像正文片段，适合先提取信息，但需要作者确认范围。",
    book_profile: "这更像书名、题材或小说简介输入，适合更新作品资料。",
    outline: "这更像卷级或章节级大纲，适合生成待确认的大纲提案。",
    setting: "这更像设定想法，适合生成待确认的设定提案。",
    character: "这更像人设候选，尤其不能直接写入角色正史。",
    worldbuilding: "这更像世界观想法，适合检查是否和已有世界规则冲突。",
    ambiguity: "这更像有意留白，应避免被系统提前解释死。",
    style_feedback: "这更像文风反馈，适合整理为待确认的文风规则。",
    learning_sample: "这更像外部优秀样本投喂，应先提炼可迁移技法，不能进入正史。",
    discarded_idea: "这更像废案或被舍弃灵感，应保存为可回看但不启用的素材。",
    rewrite_request: "这更像重写或比稿请求，应进入多版本比较。",
    chapter_variant: "这更像章节候选版本，应登记为版本，而不是直接覆盖正稿。",
    feedback: "这更像作者对 AI 稿或系统理解的反馈，适合用于后续对齐。",
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
    book_profile: ["set_book_profile", "ask_author_confirmation"],
    outline: ["generate_outline_memory_patch", "ask_author_confirmation"],
    setting: ["generate_memory_patch_candidate", "ask_author_confirmation"],
    character: ["add_to_character_candidates", "ask_author_confirmation"],
    worldbuilding: ["generate_world_contract_patch_candidate", "ask_author_confirmation"],
    ambiguity: ["add_to_intentional_ambiguity_candidate", "protect_from_auto_explanation"],
    style_feedback: ["generate_style_candidate", "review_in_weekly_alignment"],
    learning_sample: ["run_exemplar_learning", "extract_transferable_techniques"],
    discarded_idea: ["append_discarded_brilliance_candidate", "record_resurrection_triggers"],
    rewrite_request: ["register_or_generate_variants", "compare_variants"],
    chapter_variant: ["register_chapter_variant", "compare_variants"],
    feedback: ["review_alignment_feedback", "adjust_system_interpretation"],
    unknown: ["manual_review_required"],
  };
  return [...actions[type], authority.includes("L5") ? "treat_as_high_authority_input" : "do_not_apply_to_canon_directly"];
}

function excerpt(rawText: string): string {
  return rawText.replace(/\r\n/g, "\n").trim().slice(0, 500);
}
