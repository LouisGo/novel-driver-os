import path from "node:path";
import { readYaml, writeYaml } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { nowIso } from "./time.js";
import { RetconDebtSchema, RetconSeveritySchema } from "./schemas.js";
import { appendTrace } from "./trace.js";

export interface DebtAddOptions {
  chapter: string;
  issue: string;
  solution: string;
  severity: string;
}

export async function addDebt(projectName: string, options: DebtAddOptions): Promise<void> {
  const filePath = debtPath(projectName);
  const ledger = RetconDebtSchema.parse(await readYaml(filePath));
  const severity = RetconSeveritySchema.parse(options.severity || "low");
  ledger.entries.push({
    chapter: options.chapter,
    issue: options.issue,
    accepted_solution: options.solution,
    debt_type: "continuity_patch",
    severity,
    created_at: nowIso(),
  });
  ledger.current_arc_total = ledger.entries.length;
  ledger.last_10_chapters = ledger.entries.slice(-10).length;
  await writeYaml(filePath, ledger);
  await appendTrace(projectName, {
    command: "debt.add",
    artifacts: ["70_debt/retcon_debt.yaml"],
    metadata: { chapter: options.chapter, severity },
  });
}

export async function debtReport(projectName: string): Promise<string> {
  const ledger = RetconDebtSchema.parse(await readYaml(debtPath(projectName)));
  const lines = [
    `Retcon Debt Report - ${projectName}`,
    ``,
    `current_arc_total: ${ledger.current_arc_total}`,
    `last_10_chapters: ${ledger.last_10_chapters}`,
    `threshold: ${ledger.threshold}`,
    ``,
  ];

  if (ledger.last_10_chapters >= ledger.threshold) {
    lines.push("检测到近期设定偏移较多，建议暂停自动圆场，花 5 分钟回顾本卷核心冲突。", "");
  }

  if (ledger.entries.length === 0) {
    lines.push("No retcon debt entries.");
  } else {
    for (const entry of ledger.entries) {
      lines.push(`- ${entry.chapter} [${entry.severity}] ${entry.issue}`);
      lines.push(`  solution: ${entry.accepted_solution}`);
    }
  }

  return lines.join("\n");
}

function debtPath(projectName: string): string {
  return path.join(projectRoot(projectName), "70_debt/retcon_debt.yaml");
}
