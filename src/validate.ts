import path from "node:path";
import YAML from "yaml";
import { listFilesRecursive, pathExists, readText, readYaml } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { INTAKE_FILES, OPTIONAL_INTAKE_FILES } from "./intake.js";
import { REQUIRED_PROJECT_DIRS, REQUIRED_PROJECT_FILES } from "./project.js";
import {
  AuthorInputPacketSchema,
  FactDeltaSchema,
  InputStatusSchema,
  IntentionHypothesesFileSchema,
  ProjectSchema,
  PromiseLedgerSchema,
  PromisePatchSchema,
  RetconDebtSchema,
  StoryEngineSchema,
  StorycraftManifestSchema,
} from "./schemas.js";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateProject(projectName: string): Promise<ValidationResult> {
  const root = projectRoot(projectName);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!(await pathExists(root))) {
    return { ok: false, errors: [`Project not found: ${projectName}`], warnings: [] };
  }

  for (const dir of REQUIRED_PROJECT_DIRS) {
    if (!(await pathExists(path.join(root, dir)))) errors.push(`Missing directory: ${dir}`);
  }
  for (const file of REQUIRED_PROJECT_FILES) {
    if (!(await pathExists(path.join(root, file)))) errors.push(`Missing file: ${file}`);
  }

  await validateYamlFile(path.join(root, "project.yaml"), ProjectSchema.parse, errors);
  await validateYamlFile(path.join(root, "70_debt/retcon_debt.yaml"), RetconDebtSchema.parse, errors);
  await validateBookProfile(root, path.join(root, "10_bible/book_profile.yaml"), errors);
  await validateWebnovelGeneLayer(root, errors, warnings);
  await validateChapterIndex(root, path.join(root, "50_chapters/chapter_index.yaml"), errors);
  await validateSessionLedger(root, path.join(root, "session.yaml"), errors);

  const yamlFiles = (await listFilesRecursive(root)).filter((file) => /\.(yaml|yml)$/i.test(file));
  for (const file of yamlFiles) {
    try {
      YAML.parse(await readText(file));
    } catch (error) {
      errors.push(`Invalid YAML ${relative(root, file)}: ${(error as Error).message}`);
    }
  }

  const packetFiles = yamlFiles.filter((file) => /00_inbox\/(triaged|processed|ignored)\//.test(file));
  for (const file of packetFiles) {
    try {
      const packet = AuthorInputPacketSchema.parse(await readYaml(file));
      InputStatusSchema.parse(packet.status);
      const bucket = packetBucket(root, file);
      const expectedBucket = bucketForStatus(packet.status);
      if (bucket !== expectedBucket) {
        errors.push(`Input packet ${relative(root, file)} status ${packet.status} belongs in 00_inbox/${expectedBucket}/`);
      }
      if (packet.status === "ignored" && packet.requires_confirmation) {
        errors.push(`Input packet ${relative(root, file)} is ignored but still requires confirmation`);
      }
    } catch (error) {
      errors.push(`Invalid input packet ${relative(root, file)}: ${(error as Error).message}`);
    }
  }

  const routeFiles = yamlFiles.filter((file) => /00_inbox\/routes\/.+\.route\.ya?ml$/.test(file));
  for (const file of routeFiles) {
    try {
      const route = await readYaml(file);
      if (!isRecord(route) || typeof route.input_id !== "string" || typeof route.primary_route !== "string" || !Array.isArray(route.next_commands)) {
        errors.push(`Invalid route plan ${relative(root, file)}: missing input_id, primary_route or next_commands`);
      }
    } catch (error) {
      errors.push(`Invalid route plan ${relative(root, file)}: ${(error as Error).message}`);
    }
  }

  const reviewFiles = yamlFiles.filter((file) => /00_inbox\/reviews\/.+\.review\.ya?ml$/.test(file));
  for (const file of reviewFiles) {
    try {
      const decision = await readYaml(file);
      if (!isRecord(decision) || typeof decision.input_id !== "string" || !["approved", "rejected", "archived"].includes(String(decision.decision))) {
        errors.push(`Invalid review decision ${relative(root, file)}: decision must be approved, rejected or archived`);
      }
    } catch (error) {
      errors.push(`Invalid review decision ${relative(root, file)}: ${(error as Error).message}`);
    }
  }

  const intakeDirs = await listIntakeDirs(root);
  for (const dir of intakeDirs) {
    const hasFactDelta = await pathExists(path.join(dir, "fact_delta.yaml"));
    const hasMemoryPatch = await pathExists(path.join(dir, "memory_patch.yaml"));
    if (hasFactDelta) {
      for (const file of INTAKE_FILES) {
        if (!(await pathExists(path.join(dir, file)))) {
          errors.push(`Incomplete intake capsule ${relative(root, dir)} missing ${file}`);
        }
      }
      await validateYamlFile(path.join(dir, "fact_delta.yaml"), FactDeltaSchema.parse, errors);
      await validateYamlFile(path.join(dir, "intention_hypotheses.yaml"), IntentionHypothesesFileSchema.parse, errors);
      await validateAtmosphereTriads(root, path.join(dir, "atmosphere_triads.md"), errors);
      await validateVibeFiles(root, dir, errors);
      await validateOptionalIntakeFiles(root, dir, errors);
    }
    if (hasMemoryPatch) {
      await validateMemoryPatch(root, path.join(dir, "memory_patch.yaml"), errors);
    }
    if (!hasFactDelta && !hasMemoryPatch) {
      errors.push(`Intake/proposal directory ${relative(root, dir)} must contain fact_delta.yaml or memory_patch.yaml`);
    }
  }

  await validateRetconDebtProtocol(root, path.join(root, "70_debt/retcon_debt.yaml"), errors);
  await validateVariants(root, errors);
  await validateStorycraftArtifacts(root, errors);
  await validateSnapshots(root, errors);

  const discarded = path.join(root, "40_style/discarded_brilliance.md");
  if (await pathExists(discarded)) {
    const text = await readText(discarded);
    if (!text.includes("resurrection_triggers")) {
      errors.push("discarded_brilliance.md must mention resurrection_triggers");
    }
  }

  await validateTraceFile(root, path.join(root, "trace.jsonl"), errors);

  return { ok: errors.length === 0, errors, warnings };
}

async function validateBookProfile(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    const value = await readYaml(filePath);
    if (!isRecord(value) || typeof value.title !== "string" || typeof value.synopsis !== "string") {
      errors.push(`${relative(root, filePath)} must contain title and synopsis`);
    }
  } catch (error) {
    errors.push(`Invalid ${relative(root, filePath)}: ${(error as Error).message}`);
  }
}

export function formatValidation(result: ValidationResult): string {
  const warnings = result.warnings.length > 0 ? ["", "WARNINGS:", ...result.warnings.map((warning) => `- ${warning}`)] : [];
  if (result.ok) return ["VALID: project file protocol passed.", ...warnings].join("\n");
  return ["INVALID: project file protocol failed.", "", ...result.errors.map((error) => `- ${error}`), ...warnings].join("\n");
}

async function listIntakeDirs(root: string): Promise<string[]> {
  const dir = path.join(root, "01_intake");
  if (!(await pathExists(dir))) return [];
  const files = await listFilesRecursive(dir);
  return [...new Set(files.map((file) => path.dirname(file)).filter((value) => path.basename(value).startsWith("input_")))];
}

async function validateYamlFile(filePath: string, parser: (value: unknown) => unknown, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    parser(await readYaml(filePath));
  } catch (error) {
    errors.push(`Invalid ${filePath}: ${(error as Error).message}`);
  }
}

function relative(root: string, file: string): string {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function packetBucket(root: string, file: string): string {
  const parts = relative(root, file).split("/");
  return parts[1] ?? "";
}

function bucketForStatus(status: string): "triaged" | "processed" | "ignored" {
  if (status === "ignored" || status === "archived") return "ignored";
  if (["processed", "pending_confirmation", "approved_pending_apply", "applied"].includes(status)) return "processed";
  return "triaged";
}

async function validateAtmosphereTriads(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  const text = await readText(filePath);
  const blocks = text.split(/^##\s+vibe_[a-z0-9_-]+:/gim).length - 1;
  if (blocks !== 3) {
    errors.push(`${relative(root, filePath)} must contain exactly 3 vibe hypotheses`);
  }
  for (const required of ["解释", "证据", "confidence:", "requires_confirmation: true", "status: tentative"]) {
    if (!text.includes(required)) {
      errors.push(`${relative(root, filePath)} missing ${required}`);
    }
  }
}

async function validateVibeFiles(root: string, dir: string, errors: string[]): Promise<void> {
  const confirmedPath = path.join(dir, "confirmed_vibes.md");
  if (await pathExists(confirmedPath)) {
    const confirmed = await readText(confirmedPath);
    if (/^## Confirmed[\s\S]*^status:\s*tentative\s*$/m.test(confirmed)) {
      errors.push(`${relative(root, confirmedPath)} contains a confirmed vibe with tentative status`);
    }
    if (/^## Confirmed[\s\S]*^requires_confirmation:\s*true\s*$/m.test(confirmed)) {
      errors.push(`${relative(root, confirmedPath)} contains a confirmed vibe that still requires confirmation`);
    }
  }

  const tentativePath = path.join(dir, "tentative_vibes.md");
  if (await pathExists(tentativePath)) {
    const tentative = await readText(tentativePath);
    if (tentative.includes("## Tentative") && !tentative.includes("ttl: short_term")) {
      errors.push(`${relative(root, tentativePath)} tentative vibes must declare ttl: short_term`);
    }
    if (tentative.includes("## Tentative") && !tentative.includes("cannot_enter_canon: true")) {
      errors.push(`${relative(root, tentativePath)} tentative vibes must declare cannot_enter_canon: true`);
    }
  }
}

async function validateMemoryPatch(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    const value = await readYaml(filePath);
    if (!isRecord(value) || value.requires_human_approval !== true) {
      errors.push(`${relative(root, filePath)} must set requires_human_approval: true`);
    }
  } catch (error) {
    errors.push(`Invalid ${relative(root, filePath)}: ${(error as Error).message}`);
  }
}

async function validateChapterIndex(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    const value = await readYaml(filePath);
    if (!isRecord(value) || !Array.isArray(value.chapters)) {
      errors.push(`${relative(root, filePath)} must contain chapters array`);
      return;
    }
    for (const [index, entry] of value.chapters.entries()) {
      if (!isRecord(entry) || typeof entry.chapter !== "string" || !["hot", "warm", "cold"].includes(String(entry.layer)) || typeof entry.file !== "string") {
        errors.push(`${relative(root, filePath)} chapters[${index}] must include chapter, layer and file`);
        continue;
      }
      if (entry.file.startsWith("/") || entry.file.split(/[\\/]/).includes("..")) {
        errors.push(`${relative(root, filePath)} chapters[${index}].file must be project-relative`);
      }
      if (!(await pathExists(path.join(root, entry.file)))) {
        errors.push(`${relative(root, filePath)} chapters[${index}].file does not exist: ${entry.file}`);
      }
    }
  } catch (error) {
    errors.push(`Invalid ${relative(root, filePath)}: ${(error as Error).message}`);
  }
}

async function validateSessionLedger(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    const value = await readYaml(filePath);
    if (!isRecord(value) || !["active", "paused"].includes(String(value.state))) {
      errors.push(`${relative(root, filePath)} state must be active or paused`);
    }
  } catch (error) {
    errors.push(`Invalid ${relative(root, filePath)}: ${(error as Error).message}`);
  }
}

async function validateOptionalIntakeFiles(root: string, dir: string, errors: string[]): Promise<void> {
  for (const file of OPTIONAL_INTAKE_FILES) {
    const filePath = path.join(dir, file);
    if (!(await pathExists(filePath))) continue;
    const text = await readText(filePath);
    if (file === "chapter_quality_review.md") validateChapterQualityReview(root, filePath, text, errors);
    if (file === "promise_ledger_update.yaml") await validateYamlFile(filePath, PromisePatchSchema.parse, errors);
  }
}

async function validateWebnovelGeneLayer(root: string, errors: string[], warnings: string[]): Promise<void> {
  const storyEngine = path.join(root, "10_bible/story_engine.yaml");
  const promiseLedger = path.join(root, "30_plot/promise_ledger.yaml");
  const geneDir = path.join(root, "35_storycraft/gene");
  const serialPlanDir = path.join(root, "35_storycraft/serial_plan");

  if (await pathExists(storyEngine)) {
    await validateYamlFile(storyEngine, StoryEngineSchema.parse, errors);
  } else {
    warnings.push("Missing optional narrative mechanism file: 10_bible/story_engine.yaml. Run `novel migrate webnovel-gene <project>`.");
  }

  if (await pathExists(promiseLedger)) {
    await validateYamlFile(promiseLedger, PromiseLedgerSchema.parse, errors);
  } else {
    warnings.push("Missing optional promise ledger: 30_plot/promise_ledger.yaml. Run `novel migrate webnovel-gene <project>`.");
  }

  if (!(await pathExists(geneDir))) {
    warnings.push("Missing optional storycraft directory: 35_storycraft/gene.");
  }
  if (!(await pathExists(serialPlanDir))) {
    warnings.push("Missing optional storycraft directory: 35_storycraft/serial_plan.");
  }
}

function validateChapterQualityReview(root: string, filePath: string, text: string, errors: string[]): void {
  for (const required of ["review_type: chapter_quality_review", "overall_score:", "decision:", "## Scorecard", "## Revision Prescription"]) {
    if (!text.includes(required)) {
      errors.push(`${relative(root, filePath)} missing ${required}`);
    }
  }
  const decision = text.match(/^decision:\s*(\S+)/m)?.[1];
  if (decision && !["pass", "minor_revision", "major_revision", "rewrite"].includes(decision)) {
    errors.push(`${relative(root, filePath)} has invalid decision ${decision}`);
  }
  const scoreValue = Number(text.match(/^overall_score:\s*([0-9.]+)/m)?.[1]);
  if (!Number.isFinite(scoreValue) || scoreValue < 1 || scoreValue > 5) {
    errors.push(`${relative(root, filePath)} overall_score must be between 1 and 5`);
  }
}

async function validateRetconDebtProtocol(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  try {
    const ledger = RetconDebtSchema.parse(await readYaml(filePath));
    if (ledger.current_arc_total !== ledger.entries.length) {
      errors.push(`${relative(root, filePath)} current_arc_total must equal entries.length`);
    }
    if (ledger.last_10_chapters !== Math.min(10, ledger.entries.length)) {
      errors.push(`${relative(root, filePath)} last_10_chapters must equal the last 10 entry count`);
    }
  } catch {
    // validateYamlFile already reports schema errors for this file.
  }
}

async function validateVariants(root: string, errors: string[]): Promise<void> {
  const variantFiles = (await listFilesRecursive(path.join(root, "50_chapters/variants"))).filter((file) => file.endsWith("variants.yaml"));
  for (const file of variantFiles) {
    try {
      const value = await readYaml(file);
      if (!isRecord(value) || typeof value.input_id !== "string" || !Array.isArray(value.variants)) {
        errors.push(`${relative(root, file)} must contain input_id and variants array`);
        continue;
      }
      for (const [index, variant] of value.variants.entries()) {
        if (!isRecord(variant) || typeof variant.variant_id !== "string" || typeof variant.file !== "string" || !["candidate", "winner", "rejected"].includes(String(variant.status))) {
          errors.push(`${relative(root, file)} variants[${index}] must include variant_id, file and valid status`);
          continue;
        }
        if (!(await pathExists(path.join(root, variant.file)))) {
          errors.push(`${relative(root, file)} variants[${index}].file does not exist: ${variant.file}`);
        }
      }
      const winners = value.variants.filter((variant: unknown) => isRecord(variant) && variant.status === "winner");
      if (winners.length > 1) errors.push(`${relative(root, file)} cannot contain more than one winner`);
    } catch (error) {
      errors.push(`Invalid ${relative(root, file)}: ${(error as Error).message}`);
    }
  }
}

async function validateStorycraftArtifacts(root: string, errors: string[]): Promise<void> {
  const storycraftFiles = (await listFilesRecursive(path.join(root, "35_storycraft"))).filter((file) => file.endsWith(".yaml"));
  for (const file of storycraftFiles) {
    try {
      const manifest = StorycraftManifestSchema.parse(await readYaml(file));
      if (!(await pathExists(path.join(root, manifest.content_file)))) {
        errors.push(`${relative(root, file)} content_file does not exist: ${manifest.content_file}`);
      }
      const expected = `35_storycraft/${manifest.kind}/`;
      if (!relative(root, file).startsWith(expected)) {
        errors.push(`${relative(root, file)} kind ${manifest.kind} belongs under ${expected}`);
      }
    } catch (error) {
      errors.push(`Invalid storycraft manifest ${relative(root, file)}: ${(error as Error).message}`);
    }
  }
}

async function validateSnapshots(root: string, errors: string[]): Promise<void> {
  const manifests = (await listFilesRecursive(path.join(root, "90_archive/snapshots"))).filter((file) => file.endsWith("manifest.yaml"));
  for (const file of manifests) {
    try {
      const value = await readYaml(file);
      if (!isRecord(value) || typeof value.snapshot_id !== "string" || !Array.isArray(value.scopes)) {
        errors.push(`${relative(root, file)} must contain snapshot_id and scopes array`);
      }
    } catch (error) {
      errors.push(`Invalid ${relative(root, file)}: ${(error as Error).message}`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function validateTraceFile(root: string, filePath: string, errors: string[]): Promise<void> {
  if (!(await pathExists(filePath))) return;
  const lines = (await readText(filePath)).split(/\r?\n/).filter(Boolean);
  for (const [index, line] of lines.entries()) {
    try {
      const event = JSON.parse(line);
      if (!isRecord(event) || typeof event.event_id !== "string" || typeof event.command !== "string") {
        errors.push(`${relative(root, filePath)} line ${index + 1} missing event_id or command`);
      }
    } catch (error) {
      errors.push(`Invalid trace JSON ${relative(root, filePath)} line ${index + 1}: ${(error as Error).message}`);
    }
  }
}
