import { z } from "zod";

export const InputStatusSchema = z.enum([
  "raw",
  "triaged",
  "routed",
  "processed",
  "pending_confirmation",
  "applied",
  "archived",
  "ignored",
]);

export const InputTypeSchema = z.enum([
  "inspiration",
  "chapter",
  "fragment",
  "setting",
  "character",
  "worldbuilding",
  "ambiguity",
  "style_feedback",
  "discarded_idea",
  "feedback",
  "unknown",
]);

export const TargetScopeSchema = z.object({
  entity: z.string().nullable(),
  chapter: z.string().nullable(),
  volume: z.string().nullable(),
});

export const AuthorInputPacketSchema = z.object({
  input_id: z.string().min(1),
  project: z.string().min(1),
  source_channel: z.string().min(1),
  source_type: z.string().min(1),
  raw_source_path: z.string().min(1),
  detected_type: InputTypeSchema,
  target_scope: TargetScopeSchema,
  authority_level: z.string().min(1),
  status: InputStatusSchema,
  confidence: z.number().min(0).max(1),
  raw_text_excerpt: z.string(),
  system_interpretation: z.array(z.string()),
  requires_confirmation: z.boolean(),
  recommended_actions: z.array(z.string()),
  created_at: z.string().min(1),
});

export type InputStatus = z.infer<typeof InputStatusSchema>;
export type InputType = z.infer<typeof InputTypeSchema>;
export type AuthorInputPacket = z.infer<typeof AuthorInputPacketSchema>;

export const IntentionHypothesisSchema = z.object({
  id: z.string().min(1),
  level: z.enum(["L1_explicit", "L2_strong_inference", "L3_weak_guess"]),
  content: z.string().min(1),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  ttl: z.union([z.string().min(1), z.number().int().positive()]),
  can_enter_decision_log: z.union([z.boolean(), z.literal("needs_confirmation")]),
  status: z.string().min(1),
});

export const IntentionHypothesesFileSchema = z.object({
  intention_hypotheses: z.array(IntentionHypothesisSchema),
});

export const FactDeltaSchema = z.object({
  chapter: z.string().min(1),
  source: z.string().min(1),
  new_facts: z.array(z.string()),
  character_changes: z.record(z.array(z.string())),
  hooks_opened: z.array(z.string()),
  hooks_closed: z.array(z.string()),
  constraints_for_future: z.array(z.string()),
  source_refs: z.array(z.object({ file: z.string().min(1) })),
});

export const RetconDebtEntrySchema = z.object({
  chapter: z.string().min(1),
  issue: z.string().min(1),
  accepted_solution: z.string().min(1),
  debt_type: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]).or(z.string().min(1)),
  created_at: z.string().optional(),
});

export const RetconDebtSchema = z.object({
  current_arc_total: z.number().int().nonnegative(),
  last_10_chapters: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
  entries: z.array(RetconDebtEntrySchema),
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  schema_version: z.string().min(1),
  created_at: z.string().min(1),
  mode: z.enum(["manual_first", "assisted", "auto_reserved"]).or(z.string().min(1)),
  canon_policy: z.object({
    ai_may_modify_canon_directly: z.literal(false),
    ai_outputs_are: z.array(z.string()),
  }),
});
