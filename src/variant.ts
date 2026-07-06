import path from "node:path";
import { ensureDir, pathExists, readText, readYaml, writeText, writeYaml } from "./fs-utils.js";
import { findPacket } from "./input.js";
import { assertSafeId, projectRoot, safeName } from "./paths.js";
import { appendTrace } from "./trace.js";
import { compactTimestamp, nowIso } from "./time.js";
import { createSnapshot } from "./snapshot.js";

const DIMENSIONS = [
  "章节目标贴合度",
  "主角行动链",
  "爽点/钩子",
  "设定一致性",
  "人物高亮",
  "风格贴合",
  "AI 味",
  "毒点风险",
  "后续可持续性",
];

export interface VariantEntry {
  variant_id: string;
  label: string;
  file: string;
  source_input: string;
  chapter: string | null;
  registered_at: string;
  status: "candidate" | "winner" | "rejected";
}

export interface VariantManifest {
  input_id: string;
  variants: VariantEntry[];
  winner_variant_id: string | null;
  updated_at: string;
}

export async function registerVariant(
  projectName: string,
  inputId: string,
  fromFile: string,
  label: string,
  chapter: string | null,
): Promise<{ ok: true; variant: VariantEntry; changed_files: string[] }> {
  assertSafeId(inputId, "inputId");
  await findPacket(projectName, inputId);
  const root = projectRoot(projectName);
  const source = path.resolve(fromFile);
  const draft = await readText(source);
  const dir = path.join(root, "50_chapters/variants", inputId);
  await ensureDir(dir);

  const variantId = `variant_${compactTimestamp()}_${safeName(label).slice(0, 24) || "draft"}`;
  const target = path.join(dir, `${variantId}.txt`);
  await writeText(target, draft.trim());

  const manifestPath = path.join(dir, "variants.yaml");
  const manifest = await readVariantManifest(manifestPath, inputId);
  const entry: VariantEntry = {
    variant_id: variantId,
    label,
    file: path.relative(root, target).replaceAll(path.sep, "/"),
    source_input: inputId,
    chapter,
    registered_at: nowIso(),
    status: "candidate",
  };
  manifest.variants.push(entry);
  manifest.updated_at = nowIso();
  await writeYaml(manifestPath, manifest);

  const changedFiles = [
    entry.file,
    path.relative(root, manifestPath).replaceAll(path.sep, "/"),
  ];
  await appendTrace(projectName, {
    command: "variant.register",
    input_id: inputId,
    artifacts: changedFiles,
    metadata: { variant_id: variantId, label, chapter },
  });

  return { ok: true, variant: entry, changed_files: changedFiles };
}

export async function compareVariants(projectName: string, inputId: string): Promise<{ ok: true; changed_files: string[]; report: string }> {
  assertSafeId(inputId, "inputId");
  const root = projectRoot(projectName);
  const dir = path.join(root, "50_chapters/variants", inputId);
  const manifestPath = path.join(dir, "variants.yaml");
  const manifest = await readVariantManifest(manifestPath, inputId);
  if (manifest.variants.length < 2) {
    throw new Error("variant compare requires at least two registered variants.");
  }

  const rows: Array<{ variant: VariantEntry; scores: Record<string, number>; total: number }> = [];
  for (const variant of manifest.variants) {
    const text = await readText(path.join(root, variant.file));
    const scores = scoreVariant(text);
    const total = Math.round((Object.values(scores).reduce((sum, value) => sum + value, 0) / DIMENSIONS.length) * 10) / 10;
    rows.push({ variant, scores, total });
  }
  rows.sort((a, b) => b.total - a.total);

  const report = `# Variant Compare Report - ${inputId}

generated_at: ${nowIso()}
status: report_only

| 排名 | variant | label | 平均分 | ${DIMENSIONS.join(" | ")} |
| ---: | --- | --- | ---: | ${DIMENSIONS.map(() => "---:").join(" | ")} |
${rows.map((row, index) => `| ${index + 1} | ${row.variant.variant_id} | ${row.variant.label} | ${row.total.toFixed(1)} | ${DIMENSIONS.map((dimension) => row.scores[dimension].toFixed(1)).join(" | ")} |`).join("\n")}

## Recommendation

当前启发式推荐：${rows[0].variant.variant_id} / ${rows[0].variant.label}

> 该报告只用于比稿，不会自动定稿。胜出稿仍需 \`variant decide\` 和 \`chapter accept\`。
`;
  const reportPath = path.join(dir, "compare_report.md");
  await writeText(reportPath, report);
  const changedFiles = [path.relative(root, reportPath).replaceAll(path.sep, "/")];
  await appendTrace(projectName, {
    command: "variant.compare",
    input_id: inputId,
    artifacts: changedFiles,
    metadata: { recommended_variant_id: rows[0].variant.variant_id },
  });
  return { ok: true, changed_files: changedFiles, report };
}

export async function decideVariant(
  projectName: string,
  inputId: string,
  variantId: string,
  note: string | null,
): Promise<{ ok: true; winner_variant_id: string; changed_files: string[] }> {
  assertSafeId(inputId, "inputId");
  assertSafeId(variantId, "variantId");
  const root = projectRoot(projectName);
  const dir = path.join(root, "50_chapters/variants", inputId);
  const manifestPath = path.join(dir, "variants.yaml");
  const manifest = await readVariantManifest(manifestPath, inputId);
  if (!manifest.variants.some((variant) => variant.variant_id === variantId)) {
    throw new Error(`Variant not found: ${variantId}`);
  }

  await createSnapshot(projectName, `before_variant_decide_${inputId}`);
  manifest.winner_variant_id = variantId;
  manifest.updated_at = nowIso();
  manifest.variants = manifest.variants.map((variant) => ({
    ...variant,
    status: variant.variant_id === variantId ? "winner" : "rejected",
  }));
  await writeYaml(manifestPath, manifest);

  const decisionPath = path.join(dir, "decision.yaml");
  await writeYaml(decisionPath, {
    input_id: inputId,
    winner_variant_id: variantId,
    note,
    decided_at: nowIso(),
    next_commands: [`novel chapter accept <project> ${inputId} --variant ${variantId} --chapter <chapter> --layer hot`],
  });
  const changedFiles = [
    path.relative(root, manifestPath).replaceAll(path.sep, "/"),
    path.relative(root, decisionPath).replaceAll(path.sep, "/"),
  ];
  await appendTrace(projectName, {
    command: "variant.decide",
    input_id: inputId,
    artifacts: changedFiles,
    metadata: { winner_variant_id: variantId },
  });
  return { ok: true, winner_variant_id: variantId, changed_files: changedFiles };
}

async function readVariantManifest(manifestPath: string, inputId: string): Promise<VariantManifest> {
  if (!(await pathExists(manifestPath))) {
    return { input_id: inputId, variants: [], winner_variant_id: null, updated_at: nowIso() };
  }
  const parsed = await readYaml<Partial<VariantManifest>>(manifestPath);
  return {
    input_id: parsed.input_id ?? inputId,
    variants: Array.isArray(parsed.variants) ? parsed.variants : [],
    winner_variant_id: parsed.winner_variant_id ?? null,
    updated_at: parsed.updated_at ?? nowIso(),
  };
}

function scoreVariant(text: string): Record<string, number> {
  const lengthBonus = text.length > 500 ? 0.4 : 0;
  const action = /问|说|跑|抓|按|推|救|杀|逃|选择|证明|发现|写|拔|挡/.test(text) ? 0.5 : 0;
  const pressure = /死|血|痛|危险|必须|不能|代价|审|追|反噬/.test(text) ? 0.5 : 0;
  const hook = /[？?]|真相|秘密|名字|钟|门|残页|谁|不是|为什么/.test(text) ? 0.5 : 0;
  const texture = /掌心|灰|雨|血|门|灯|袖|铜|伤口|声音|指尖|灰/.test(text) ? 0.4 : 0;
  const aiRisk = (text.match(/然而|仿佛|某种|命运|古老|神秘|宏伟/g) ?? []).length;
  const base = 3.4 + lengthBonus;
  return {
    "章节目标贴合度": clamp(base + hook),
    "主角行动链": clamp(base + action),
    "爽点/钩子": clamp(base + hook + pressure * 0.4),
    "设定一致性": clamp(base + (/规则|契约|代价|设定|境界|火|灰/.test(text) ? 0.3 : 0)),
    "人物高亮": clamp(base + action + texture * 0.3),
    "风格贴合": clamp(base + texture - Math.min(0.6, aiRisk * 0.1)),
    "AI 味": clamp(4.4 - Math.min(1.2, aiRisk * 0.2)),
    "毒点风险": clamp(3.8 + (/代价|失败|风险|不能|疼|痛|失去/.test(text) ? 0.5 : 0)),
    "后续可持续性": clamp(base + hook),
  };
}

function clamp(value: number): number {
  return Math.round(Math.max(1, Math.min(5, value)) * 10) / 10;
}
