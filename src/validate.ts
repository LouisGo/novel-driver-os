import path from "node:path";
import YAML from "yaml";
import { listFilesRecursive, pathExists, readText, readYaml } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { INTAKE_FILES } from "./intake.js";
import { REQUIRED_PROJECT_DIRS, REQUIRED_PROJECT_FILES } from "./project.js";
import {
  AuthorInputPacketSchema,
  FactDeltaSchema,
  InputStatusSchema,
  IntentionHypothesesFileSchema,
  ProjectSchema,
  RetconDebtSchema,
} from "./schemas.js";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export async function validateProject(projectName: string): Promise<ValidationResult> {
  const root = projectRoot(projectName);
  const errors: string[] = [];

  if (!(await pathExists(root))) {
    return { ok: false, errors: [`Project not found: ${projectName}`] };
  }

  for (const dir of REQUIRED_PROJECT_DIRS) {
    if (!(await pathExists(path.join(root, dir)))) errors.push(`Missing directory: ${dir}`);
  }
  for (const file of REQUIRED_PROJECT_FILES) {
    if (!(await pathExists(path.join(root, file)))) errors.push(`Missing file: ${file}`);
  }

  await validateYamlFile(path.join(root, "project.yaml"), ProjectSchema.parse, errors);
  await validateYamlFile(path.join(root, "70_debt/retcon_debt.yaml"), RetconDebtSchema.parse, errors);

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

  const intakeDirs = await listIntakeDirs(root);
  for (const dir of intakeDirs) {
    for (const file of INTAKE_FILES) {
      if (!(await pathExists(path.join(dir, file)))) {
        errors.push(`Incomplete intake capsule ${relative(root, dir)} missing ${file}`);
      }
    }
    await validateYamlFile(path.join(dir, "fact_delta.yaml"), FactDeltaSchema.parse, errors);
    await validateYamlFile(path.join(dir, "intention_hypotheses.yaml"), IntentionHypothesesFileSchema.parse, errors);
    await validateAtmosphereTriads(root, path.join(dir, "atmosphere_triads.md"), errors);
    await validateVibeFiles(root, dir, errors);
    await validateMemoryPatch(root, path.join(dir, "memory_patch.yaml"), errors);
  }

  await validateRetconDebtProtocol(root, path.join(root, "70_debt/retcon_debt.yaml"), errors);

  const discarded = path.join(root, "40_style/discarded_brilliance.md");
  if (await pathExists(discarded)) {
    const text = await readText(discarded);
    if (!text.includes("resurrection_triggers")) {
      errors.push("discarded_brilliance.md must mention resurrection_triggers");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function formatValidation(result: ValidationResult): string {
  if (result.ok) return "VALID: project file protocol passed.";
  return ["INVALID: project file protocol failed.", "", ...result.errors.map((error) => `- ${error}`)].join("\n");
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
  if (["processed", "pending_confirmation", "applied"].includes(status)) return "processed";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
