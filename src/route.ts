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
  responsible_roles: string[];
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
    responsible_roles: rolesFor(packet.detected_type),
    blocked_by: route.blocked,
    risk_notes: warnings,
    next_actions: actionsFor(packet.detected_type, route.blocked),
    next_commands: commands,
  };
}

function routeFor(type: InputType): { primary: string; secondary: string[]; blocked: string[] } {
  const routes: Record<InputType, { primary: string; secondary: string[]; blocked: string[] }> = {
    inspiration: {
      primary: "premise_alchemy",
      secondary: ["payoff_architecture", "weekly_alignment"],
      blocked: ["agent_skill_required_novel_premise_alchemy"],
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
    book_profile: {
      primary: "premise_alchemy",
      secondary: ["book_profile", "style_candidate", "weekly_alignment"],
      blocked: ["agent_skill_required_novel_premise_alchemy"],
    },
    outline: {
      primary: "emotion_curve",
      secondary: ["payoff_architecture", "memory_patch_proposal", "canon_checker"],
      blocked: [],
    },
    setting: {
      primary: "memory_patch_proposal",
      secondary: ["canon_checker"],
      blocked: [],
    },
    character: {
      primary: "memory_patch_proposal",
      secondary: ["canon_checker"],
      blocked: [],
    },
    worldbuilding: {
      primary: "world_contract_builder",
      secondary: ["memory_patch_proposal", "canon_checker"],
      blocked: ["agent_skill_required_novel_world_contract_builder"],
    },
    ambiguity: {
      primary: "intentional_ambiguity",
      secondary: ["context_guard"],
      blocked: [],
    },
    style_feedback: {
      primary: "style_candidate",
      secondary: ["weekly_alignment"],
      blocked: [],
    },
    learning_sample: {
      primary: "exemplar_learning",
      secondary: ["learning_transfer", "style_candidate"],
      blocked: ["agent_skill_required_novel_exemplar_learning"],
    },
    discarded_idea: {
      primary: "discarded_brilliance",
      secondary: ["ghost_resonance"],
      blocked: [],
    },
    rewrite_request: {
      primary: "variant_workflow",
      secondary: ["chapter_brief", "chapter_quality_review", "style_candidate"],
      blocked: ["agent_must_generate_variant_files_before_register"],
    },
    chapter_variant: {
      primary: "variant_workflow",
      secondary: ["chapter_quality_review", "variant_compare"],
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
    inspiration: [`agent: use novel-premise-alchemy for ${projectName} ${inputId}`, `novel storycraft premise create ${projectName} --source-input ${inputId} --from-file <premise-report>`, `novel storycraft gene create ${projectName} --source-input ${inputId} --from-file <gene-report>`],
    chapter: [`novel intake chapter ${projectName} ${inputId}`],
    fragment: [`novel intake chapter ${projectName} ${inputId}`],
    book_profile: [`agent: use novel-premise-alchemy for ${projectName} ${inputId}`, `novel storycraft premise create ${projectName} --source-input ${inputId} --from-file <premise-report>`, `novel storycraft gene create ${projectName} --source-input ${inputId} --from-file <gene-report>`, `novel book set ${projectName} --source-input ${inputId} --title <title> --synopsis <synopsis>`],
    outline: [`agent: use novel-emotion-curve for ${projectName} ${inputId}`, `novel storycraft emotion create ${projectName} --source-input ${inputId} --from-file <emotion-report>`, `novel storycraft serial_plan create ${projectName} --source-input ${inputId} --from-file <serial-plan-report>`, `novel propose ${projectName} ${inputId} --kind outline`],
    setting: [`novel propose ${projectName} ${inputId} --kind setting`],
    character: [`novel propose ${projectName} ${inputId} --kind character`],
    worldbuilding: [`agent: use novel-world-contract-builder for ${projectName} ${inputId}`, `agent: world contract must cover resources, hierarchy, rules, taboos and secrets`, `novel storycraft gene create ${projectName} --source-input ${inputId} --from-file <gene-report>`, `novel propose ${projectName} ${inputId} --kind worldbuilding`],
    ambiguity: [`novel propose ${projectName} ${inputId} --kind ambiguity`],
    style_feedback: [`novel style candidate ${projectName} ${inputId}`],
    learning_sample: [`agent: use novel-exemplar-learning for ${projectName} ${inputId}`],
    discarded_idea: [`novel ghost scan ${projectName}`],
    rewrite_request: [`agent: use novel-chapter-brief-builder for ${projectName} ${inputId}`, `novel storycraft brief create ${projectName} --source-input ${inputId} --from-file <brief-file> --chapter <chapter>`, `novel variant register ${projectName} ${inputId} --from-file <draft-file> --label <label>`],
    chapter_variant: [`novel storycraft brief create ${projectName} --source-input ${inputId} --from-file <brief-file> --chapter <chapter>`, `novel variant register ${projectName} ${inputId} --from-file <draft-file> --label <label>`],
    feedback: [`novel align weekly ${projectName}`],
    unknown: [`novel review detail ${projectName} ${inputId}`],
  };
  return commands[type];
}

function actionsFor(type: InputType, blocked: string[]): string[] {
  if (blocked.length > 0) return ["manual_review_required", ...blocked];
  const actions: Record<InputType, string[]> = {
    inspiration: ["run_premise_alchemy", "record_storycraft_premise", "review_in_weekly_alignment"],
    chapter: ["run_human_chapter_intake"],
    fragment: ["run_human_chapter_intake", "ask_author_for_scope"],
    book_profile: ["run_premise_alchemy", "set_book_profile", "confirm_title_and_synopsis"],
    outline: ["run_emotion_curve", "generate_outline_memory_patch", "ask_author_confirmation"],
    setting: ["generate_memory_patch_candidate", "ask_author_confirmation"],
    character: ["add_to_character_candidates", "ask_author_confirmation"],
    worldbuilding: ["run_world_contract_builder", "generate_world_contract_patch_candidate", "ask_author_confirmation"],
    ambiguity: ["add_to_intentional_ambiguity_candidate", "protect_from_auto_explanation"],
    style_feedback: ["generate_style_candidate", "review_in_weekly_alignment"],
    learning_sample: ["run_exemplar_learning", "extract_transferable_techniques", "do_not_copy_sample_content"],
    discarded_idea: ["append_discarded_brilliance_candidate", "record_resurrection_triggers"],
    rewrite_request: ["build_chapter_brief", "generate_variant_files", "register_variants", "compare_variants"],
    chapter_variant: ["register_chapter_variant", "compare_variants"],
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

function rolesFor(type: InputType): string[] {
  const roles: Record<InputType, string[]> = {
    inspiration: ["Router", "Premise Alchemist", "Payoff Architect", "Context Assembler"],
    chapter: ["Router", "Chapter Doctor", "Canon Checker", "Continuity Keeper", "Context Assembler"],
    fragment: ["Router", "Chapter Doctor", "Canon Checker", "Context Assembler"],
    book_profile: ["Router", "Premise Alchemist", "Style Curator", "Context Assembler"],
    outline: ["Router", "Emotion Curator", "Payoff Architect", "Canon Checker", "Continuity Keeper", "Context Assembler"],
    setting: ["Router", "Canon Checker", "Continuity Keeper"],
    character: ["Router", "Canon Checker"],
    worldbuilding: ["Router", "World Contract Builder", "Canon Checker", "Context Assembler"],
    ambiguity: ["Router", "Canon Checker", "Context Assembler"],
    style_feedback: ["Router", "Style Curator"],
    learning_sample: ["Router", "Style Curator", "Variant Judge"],
    discarded_idea: ["Router", "Continuity Keeper"],
    rewrite_request: ["Router", "Chapter Doctor", "Brief Builder", "Style Curator", "Variant Judge"],
    chapter_variant: ["Router", "Chapter Doctor", "Variant Judge"],
    feedback: ["Router", "Style Curator", "Context Assembler"],
    unknown: ["Router"],
  };
  return roles[type];
}

function routePlanPath(projectName: string, inputId: string): string {
  return path.join(projectRoot(projectName), "00_inbox/routes", `${inputId}.route.yaml`);
}
