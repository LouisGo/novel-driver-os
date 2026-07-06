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
  }

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
