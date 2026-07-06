import { z } from "zod";

const SAFE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export const SafeIdSchema = z.string().min(1).regex(SAFE_ID_RE, "must be a safe file-system id");

export const InputStatusSchema = z.enum([
  "raw",
  "triaged",
  "routed",
  "processed",
  "pending_confirmation",
  "approved_pending_apply",
  "applied",
  "archived",
  "ignored",
]);

export const InputTypeSchema = z.enum([
  "inspiration",
  "chapter",
  "fragment",
  "book_profile",
  "outline",
  "setting",
  "character",
  "worldbuilding",
  "ambiguity",
  "style_feedback",
  "learning_sample",
  "discarded_idea",
  "rewrite_request",
  "chapter_variant",
  "feedback",
  "unknown",
]);

export const TargetScopeSchema = z.object({
  entity: z.string().nullable(),
  chapter: z.string().nullable(),
  volume: z.string().nullable(),
});

export const AuthorInputPacketSchema = z.object({
  input_id: SafeIdSchema,
  project: SafeIdSchema,
  source_channel: z.string().min(1),
  source_type: z.string().min(1),
  raw_source_path: z.string().min(1).refine((value) => !value.startsWith("/") && !value.split(/[\\/]/).includes(".."), {
    message: "must be a relative path inside the project",
  }),
  detected_type: InputTypeSchema,
  detected_intents: z.array(InputTypeSchema).default([]),
  target_scope: TargetScopeSchema,
  authority_level: z.string().min(1),
  status: InputStatusSchema,
  confidence: z.number().min(0).max(1),
  raw_text_excerpt: z.string(),
  system_interpretation: z.array(z.string()),
  requires_confirmation: z.boolean(),
  recommended_actions: z.array(z.string()),
  source_actor: z.enum(["human", "agent", "model"]).default("human"),
  supersedes_input_id: SafeIdSchema.nullable().optional(),
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
}).superRefine((value, ctx) => {
  const ttlChapters = chapterTtl(value.ttl);

  if (value.level === "L2_strong_inference") {
    if (value.can_enter_decision_log !== "needs_confirmation") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["can_enter_decision_log"],
        message: "L2 strong inference must require human confirmation before decision log entry",
      });
    }
    if (value.ttl === "permanent") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ttl"],
        message: "L2 strong inference must have a finite TTL",
      });
    }
  }

  if (value.level === "L3_weak_guess") {
    if (value.can_enter_decision_log !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["can_enter_decision_log"],
        message: "L3 weak guesses cannot enter the decision log",
      });
    }
    if (value.ttl === "permanent" || ttlChapters === null || ttlChapters > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ttl"],
        message: "L3 weak guesses must have a finite TTL of 3 chapters or less",
      });
    }
  }
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

export const RetconSeveritySchema = z.enum(["low", "medium", "high"]);

export const RetconDebtEntrySchema = z.object({
  chapter: z.string().min(1),
  issue: z.string().min(1),
  accepted_solution: z.string().min(1),
  debt_type: z.string().min(1),
  severity: RetconSeveritySchema,
  created_at: z.string().optional(),
});

export const RetconDebtSchema = z.object({
  current_arc_total: z.number().int().nonnegative(),
  last_10_chapters: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
  entries: z.array(RetconDebtEntrySchema),
});

export const StorycraftKindSchema = z.enum([
  "premise",
  "payoff",
  "emotion",
  "brief",
  "gene",
  "serial_plan",
]);

export const StorycraftManifestSchema = z.object({
  artifact_id: SafeIdSchema,
  project: SafeIdSchema,
  kind: StorycraftKindSchema,
  label: z.string().min(1),
  status: z.enum(["report_only", "candidate_only", "approved_reference"]).default("report_only"),
  source_input_id: SafeIdSchema.nullable(),
  target_scope: TargetScopeSchema,
  source_actor: z.enum(["human", "agent", "model"]).default("agent"),
  content_file: z.string().min(1).refine((value) => !value.startsWith("/") && !value.split(/[\\/]/).includes(".."), {
    message: "must be a relative path inside the project",
  }),
  summary: z.string(),
  created_at: z.string().min(1),
  next_commands: z.array(z.string()),
});

export type StorycraftKind = z.infer<typeof StorycraftKindSchema>;
export type StorycraftManifest = z.infer<typeof StorycraftManifestSchema>;

export const GeneFieldStatusSchema = z.enum(["candidate_only", "experimental", "approved_reference", "rejected"]);

const SourceRefSchema = z.object({
  file: z.string().min(1).optional(),
  input_id: SafeIdSchema.optional(),
  quote: z.string().optional(),
}).passthrough();

const GeneValueSchema = z.object({
  value: z.union([z.string(), z.array(z.string()), z.record(z.unknown())]).nullable(),
  status: GeneFieldStatusSchema,
  source_refs: z.array(SourceRefSchema).default([]),
}).passthrough();

export const StoryEngineSchema = z.object({
  core_emotion: GeneValueSchema,
  genre_contracts: z.array(GeneValueSchema).default([]),
  story_engines: z.array(z.object({
    name: z.string().min(1),
    status: GeneFieldStatusSchema,
    effective_scope: z.string().nullable().default(null),
    source_refs: z.array(SourceRefSchema).default([]),
  }).passthrough()).default([]),
  world_machine: z.object({
    resources: GeneValueSchema,
    hierarchy: GeneValueSchema,
    rules: GeneValueSchema,
    taboos: GeneValueSchema,
    secrets: GeneValueSchema,
  }),
  character_engine: GeneValueSchema,
  serial_policy: GeneValueSchema,
  anti_genes: z.array(z.object({
    id: SafeIdSchema,
    description: z.string().min(1),
    status: GeneFieldStatusSchema.default("candidate_only"),
    source_refs: z.array(SourceRefSchema).default([]),
  }).passthrough()).default([]),
  gene_drift_candidates: z.array(z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    evidence: z.array(z.string()),
    possible_interpretations: z.array(z.string()),
    requires_author_alignment: z.literal(true),
  }).passthrough()).default([]),
  updated_at: z.string().min(1),
});

export const PromiseOriginSchema = z.enum(["author_explicit", "text_explicit", "genre_expectation", "ai_inference", "reader_likely"]);
export const PromiseObligationLevelSchema = z.enum(["hard", "soft", "optional", "speculative"]);
export const PromiseStatusSchema = z.enum(["open", "delayed", "paid", "transformed", "red_herring", "abandoned", "dropped_candidate"]);
export const PayoffModeSchema = z.enum(["direct", "emotional_echo", "inversion", "escalation", "substitution", "red_herring", "abandoned_by_author"]);
export const PayoffQualitySchema = z.enum(["expected", "underpaid", "overpaid", "risky", "unknown"]);
export const TensionPolicySchema = z.enum(["allow_delay", "resolve_soon", "keep_ambiguous", "drop"]);

export const PromiseEntrySchema = z.object({
  id: SafeIdSchema,
  type: z.enum(["identity", "mystery", "relationship", "payoff", "resource", "world_rule", "antagonist", "emotion", "other"]),
  origin: PromiseOriginSchema,
  confidence: z.number().min(0).max(1),
  obligation_level: PromiseObligationLevelSchema,
  source_chapter: z.string().min(1),
  reader_expectation: z.string().min(1),
  author_intended_strategy: z.string().nullable().default(null),
  tension_policy: TensionPolicySchema.default("allow_delay"),
  status: PromiseStatusSchema,
  suggested_payoff_window: z.string().nullable().default(null),
  last_touched_chapter: z.string().nullable().default(null),
  payoff_mode: PayoffModeSchema.nullable().default(null),
  payoff_quality: PayoffQualitySchema.default("unknown"),
  risk: z.enum(["low", "medium", "high", "unknown"]).default("unknown"),
  source_refs: z.array(SourceRefSchema),
  updated_at: z.string().min(1),
}).superRefine((value, ctx) => {
  if (value.origin === "ai_inference" && value.obligation_level !== "speculative") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["obligation_level"],
      message: "ai_inference promises must remain speculative until author confirmation",
    });
  }
});

export const PromiseLedgerSchema = z.object({
  promises: z.array(PromiseEntrySchema),
  updated_at: z.string().min(1),
});

export const PromisePatchOperationSchema = z.object({
  op: z.enum(["add_candidate", "touch", "pay_candidate", "transform_candidate", "drop_candidate"]),
  promise_id: SafeIdSchema.optional(),
  promise: PromiseEntrySchema.optional(),
  reason: z.string().min(1).optional(),
  payoff_mode: PayoffModeSchema.optional(),
  payoff_quality: PayoffQualitySchema.optional(),
  evidence: z.array(z.string()).default([]),
  origin: PromiseOriginSchema,
  confidence: z.number().min(0).max(1),
  requires_human_approval: z.literal(true),
}).superRefine((value, ctx) => {
  if (value.op === "add_candidate" && !value.promise) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promise"], message: "add_candidate requires promise" });
  }
  if (value.op !== "add_candidate" && !value.promise_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promise_id"], message: `${value.op} requires promise_id` });
  }
});

export const PromisePatchSchema = z.object({
  patch_id: SafeIdSchema,
  source_input: SafeIdSchema,
  requires_human_approval: z.literal(true),
  created_at: z.string().min(1),
  operations: z.array(PromisePatchOperationSchema),
});

export type GeneFieldStatus = z.infer<typeof GeneFieldStatusSchema>;
export type StoryEngine = z.infer<typeof StoryEngineSchema>;
export type PromiseEntry = z.infer<typeof PromiseEntrySchema>;
export type PromiseLedger = z.infer<typeof PromiseLedgerSchema>;
export type PromisePatch = z.infer<typeof PromisePatchSchema>;

export const ProjectSchema = z.object({
  name: SafeIdSchema,
  schema_version: z.string().min(1),
  created_at: z.string().min(1),
    mode: z.enum(["manual", "manual_first", "assisted", "auto_reserved"]).or(z.string().min(1)),
  canon_policy: z.object({
    ai_may_modify_canon_directly: z.literal(false),
    ai_outputs_are: z.array(z.string()),
  }),
});

function chapterTtl(ttl: string | number): number | null {
  if (typeof ttl === "number") return ttl;
  const match = ttl.match(/^(\d+)_chapters$/);
  return match ? Number(match[1]) : null;
}
