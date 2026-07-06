import path from "node:path";
import { findPacket, listInputs, updatePacket } from "./input.js";
import { ensureDir, listFilesRecursive, pathExists, readYaml, writeYaml } from "./fs-utils.js";
import { projectRoot, relativeToProject } from "./paths.js";
import { readRoutePlan, RoutePlan } from "./route.js";
import { appendTrace } from "./trace.js";
import { AuthorInputPacket } from "./schemas.js";
import { nowIso } from "./time.js";

export type ReviewDecisionValue = "approved" | "rejected" | "archived";

export interface ReviewDecision {
  input_id: string;
  decision: ReviewDecisionValue;
  note: string | null;
  created_at: string;
}

export interface ReviewQueueItem {
  input_id: string;
  detected_type: string;
  status: string;
  authority_level: string;
  target_scope: AuthorInputPacket["target_scope"];
  recommended_actions: string[];
}

export interface ReviewDetail {
  packet: AuthorInputPacket;
  route_plan: RoutePlan | null;
  decision: ReviewDecision | null;
  artifacts: string[];
}

export interface ReviewDecisionResult {
  ok: true;
  operation_id: string;
  input_id: string;
  decision: ReviewDecision;
  changed_files: string[];
  next_commands: string[];
}

export async function listReviewQueue(projectName: string): Promise<ReviewQueueItem[]> {
  const packets = await listInputs(projectName);
  const items: ReviewQueueItem[] = [];
  for (const packet of packets) {
    const decision = await readReviewDecision(projectName, packet.input_id);
    if (packet.status === "pending_confirmation" && packet.requires_confirmation && !decision) {
      items.push({
        input_id: packet.input_id,
        detected_type: packet.detected_type,
        status: packet.status,
        authority_level: packet.authority_level,
        target_scope: packet.target_scope,
        recommended_actions: packet.recommended_actions,
      });
    }
  }
  return items;
}

export async function listPendingApply(projectName: string): Promise<ReviewQueueItem[]> {
  const packets = await listInputs(projectName);
  const items: ReviewQueueItem[] = [];
  for (const packet of packets) {
    const decision = await readReviewDecision(projectName, packet.input_id);
    if (packet.status === "pending_confirmation" && decision?.decision === "approved") {
      items.push({
        input_id: packet.input_id,
        detected_type: packet.detected_type,
        status: packet.status,
        authority_level: packet.authority_level,
        target_scope: packet.target_scope,
        recommended_actions: packet.recommended_actions,
      });
    }
  }
  return items;
}

export async function getReviewDetail(projectName: string, inputId: string): Promise<ReviewDetail> {
  const { packet } = await findPacket(projectName, inputId);
  return {
    packet,
    route_plan: await readRoutePlan(projectName, inputId),
    decision: await readReviewDecision(projectName, inputId),
    artifacts: await listInputArtifacts(projectName, inputId),
  };
}

export async function decideReview(
  projectName: string,
  inputId: string,
  decision: "approve" | "reject" | "archive",
  note: string | null,
): Promise<ReviewDecisionResult> {
  const { packet } = await findPacket(projectName, inputId);
  if (packet.status !== "pending_confirmation") {
    throw new Error(`Input ${inputId} is ${packet.status}; review decisions require pending_confirmation.`);
  }

  const normalized = normalizeDecision(decision);
  const reviewDecision: ReviewDecision = {
    input_id: inputId,
    decision: normalized,
    note,
    created_at: nowIso(),
  };

  const decisionFile = reviewDecisionPath(projectName, inputId);
  await ensureDir(path.dirname(decisionFile));
  await writeYaml(decisionFile, reviewDecision);

  const nextPacket: AuthorInputPacket = normalized === "approved"
    ? {
      ...packet,
      requires_confirmation: false,
      recommended_actions: ["apply_memory_patch", "build_context_packet"],
    }
    : {
      ...packet,
      status: "archived",
      requires_confirmation: false,
      recommended_actions: [],
    };
  await updatePacket(projectName, nextPacket);

  const changedFiles = [
    relativeToProject(projectName, decisionFile),
    normalized === "approved" ? `00_inbox/processed/${inputId}.yaml` : `00_inbox/ignored/${inputId}.yaml`,
  ];
  const trace = await appendTrace(projectName, {
    command: "review.decide",
    input_id: inputId,
    from_status: packet.status,
    to_status: nextPacket.status,
    artifacts: changedFiles,
    metadata: { decision: normalized },
  });

  return {
    ok: true,
    operation_id: trace.event_id,
    input_id: inputId,
    decision: reviewDecision,
    changed_files: changedFiles,
    next_commands: normalized === "approved" ? [`novel patch apply ${projectName} ${inputId} --target plot`] : [],
  };
}

export async function readReviewDecision(projectName: string, inputId: string): Promise<ReviewDecision | null> {
  const filePath = reviewDecisionPath(projectName, inputId);
  if (!(await pathExists(filePath))) return null;
  return readYaml<ReviewDecision>(filePath);
}

function normalizeDecision(decision: "approve" | "reject" | "archive"): ReviewDecisionValue {
  if (decision === "approve") return "approved";
  if (decision === "reject") return "rejected";
  return "archived";
}

async function listInputArtifacts(projectName: string, inputId: string): Promise<string[]> {
  const root = projectRoot(projectName);
  const dir = path.join(root, "01_intake", inputId);
  if (!(await pathExists(dir))) return [];
  return (await listFilesRecursive(dir))
    .map((file) => path.relative(root, file).replaceAll(path.sep, "/"))
    .sort();
}

function reviewDecisionPath(projectName: string, inputId: string): string {
  return path.join(projectRoot(projectName), "00_inbox/reviews", `${inputId}.review.yaml`);
}
