import path from "node:path";
import { findPacket, updatePacket } from "./input.js";
import { ensureDir, pathExists, readYaml, writeYaml } from "./fs-utils.js";
import { projectRoot, relativeToProject } from "./paths.js";
import { appendTrace } from "./trace.js";
import { AuthorInputPacket, InputType } from "./schemas.js";

export interface RoutePlan {
  input_id: string;
  primary_route: string;
  secondary_routes: string[];
  blocked_by: string[];
  confirmation_required: boolean;
  risk_notes: string[];
  next_actions: string[];
  next_commands: string[];
}

export interface RouteResult {
  ok: true;
  operation_id: string;
  route_plan: RoutePlan;
  changed_files: string[];
  warnings: string[];
}

export async function routeInput(projectName: string, inputId: string): Promise<RouteResult> {
  const { packet } = await findPacket(projectName, inputId);
  if (packet.status === "ignored" || packet.status === "archived") {
    throw new Error(`Input ${inputId} is ${packet.status}; ignored or archived inputs cannot be routed.`);
  }

  const plan = buildRoutePlan(packet);
  const root = projectRoot(projectName);
  const routeFile = routePlanPath(projectName, inputId);
  await ensureDir(path.dirname(routeFile));
  await writeYaml(routeFile, plan);

  const nextPacket: AuthorInputPacket = {
    ...packet,
    status: "routed",
    recommended_actions: plan.next_actions,
  };
  await updatePacket(projectName, nextPacket, "triaged");

  const changedFiles = [
    relativeToProject(projectName, routeFile),
    `00_inbox/triaged/${inputId}.yaml`,
  ];
  const trace = await appendTrace(projectName, {
    command: "route",
    input_id: inputId,
    from_status: packet.status,
    to_status: "routed",
    artifacts: changedFiles,
    warnings: plan.blocked_by,
    metadata: { primary_route: plan.primary_route },
  });

  return {
    ok: true,
    operation_id: trace.event_id,
    route_plan: plan,
    changed_files: changedFiles,
    warnings: plan.blocked_by,
  };
}

export async function readRoutePlan(projectName: string, inputId: string): Promise<RoutePlan | null> {
  const filePath = routePlanPath(projectName, inputId);
  if (!(await pathExists(filePath))) return null;
  return readYaml<RoutePlan>(filePath);
}

function buildRoutePlan(packet: AuthorInputPacket): RoutePlan {
  const base = {
    input_id: packet.input_id,
    confirmation_required: packet.requires_confirmation,
  };
  const warnings = riskNotesFor(packet);
  const commands = commandsFor(packet.project, packet.input_id, packet.detected_type);
  const route = routeFor(packet.detected_type);

  return {
    ...base,
    primary_route: route.primary,
    secondary_routes: route.secondary,
    blocked_by: route.blocked,
    risk_notes: warnings,
    next_actions: actionsFor(packet.detected_type, route.blocked),
    next_commands: commands,
  };
}

function routeFor(type: InputType): { primary: string; secondary: string[]; blocked: string[] } {
  const routes: Record<InputType, { primary: string; secondary: string[]; blocked: string[] }> = {
    inspiration: {
      primary: "weekly_alignment",
      secondary: ["open_questions_candidate"],
      blocked: [],
    },
    chapter: {
      primary: "human_chapter_intake",
      secondary: ["chapter_quality_review", "creative_intake_capsule"],
      blocked: [],
    },
    fragment: {
      primary: "human_chapter_intake",
      secondary: ["scope_confirmation", "chapter_quality_review"],
      blocked: [],
    },
    setting: {
      primary: "memory_patch_proposal",
      secondary: ["canon_checker"],
      blocked: ["dedicated_setting_patch_generator_not_implemented"],
    },
    character: {
      primary: "memory_patch_proposal",
      secondary: ["canon_checker"],
      blocked: ["dedicated_character_patch_generator_not_implemented"],
    },
    worldbuilding: {
      primary: "memory_patch_proposal",
      secondary: ["world_contract_review", "canon_checker"],
      blocked: ["dedicated_worldbuilding_patch_generator_not_implemented"],
    },
    ambiguity: {
      primary: "intentional_ambiguity",
      secondary: ["context_guard"],
      blocked: ["dedicated_ambiguity_apply_command_not_implemented"],
    },
    style_feedback: {
      primary: "style_candidate",
      secondary: ["weekly_alignment"],
      blocked: [],
    },
    discarded_idea: {
      primary: "discarded_brilliance",
      secondary: ["ghost_resonance"],
      blocked: [],
    },
    feedback: {
      primary: "weekly_alignment",
      secondary: ["bottleneck_diagnosis"],
      blocked: [],
    },
    unknown: {
      primary: "manual_review",
      secondary: [],
      blocked: ["input_type_unknown"],
    },
  };
  return routes[type];
}

function commandsFor(projectName: string, inputId: string, type: InputType): string[] {
  const commands: Record<InputType, string[]> = {
    inspiration: [`novel align weekly ${projectName}`],
    chapter: [`novel intake chapter ${projectName} ${inputId}`],
    fragment: [`novel intake chapter ${projectName} ${inputId}`],
    setting: [`novel review detail ${projectName} ${inputId}`],
    character: [`novel review detail ${projectName} ${inputId}`],
    worldbuilding: [`novel review detail ${projectName} ${inputId}`],
    ambiguity: [`novel review detail ${projectName} ${inputId}`],
    style_feedback: [`novel style candidate ${projectName} ${inputId}`],
    discarded_idea: [`novel ghost scan ${projectName}`],
    feedback: [`novel align weekly ${projectName}`],
    unknown: [`novel review detail ${projectName} ${inputId}`],
  };
  return commands[type];
}

function actionsFor(type: InputType, blocked: string[]): string[] {
  if (blocked.length > 0) return ["manual_review_required", ...blocked];
  const actions: Record<InputType, string[]> = {
    inspiration: ["review_in_weekly_alignment"],
    chapter: ["run_human_chapter_intake"],
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
  return actions[type];
}

function riskNotesFor(packet: AuthorInputPacket): string[] {
  const notes = ["route_plan_is_not_canon"];
  if (packet.authority_level.includes("L5")) notes.push("high_authority_input_requires_explicit_apply_step");
  if (packet.detected_type === "chapter" || packet.detected_type === "fragment") {
    notes.push("do_not_skip_fact_delta_before_memory_patch");
  }
  if (packet.detected_type === "unknown") notes.push("low_confidence_type_detection");
  return notes;
}

function routePlanPath(projectName: string, inputId: string): string {
  return path.join(projectRoot(projectName), "00_inbox/routes", `${inputId}.route.yaml`);
}
