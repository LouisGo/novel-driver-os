import path from "node:path";
import { pathExists, readYaml, writeYaml } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";
import { migrateWebnovelGene } from "./gene.js";
import {
  PayoffModeSchema,
  PayoffQualitySchema,
  PromiseEntry,
  PromiseLedger,
  PromiseLedgerSchema,
  PromisePatchSchema,
  PromiseStatusSchema,
} from "./schemas.js";

export async function promiseReport(projectName: string): Promise<{ ok: true; promises: PromiseEntry[]; summary: Record<string, number> }> {
  const ledger = await readPromiseLedger(projectName);
  const summary: Record<string, number> = {};
  for (const promise of ledger.promises) summary[promise.status] = (summary[promise.status] ?? 0) + 1;
  return { ok: true, promises: ledger.promises, summary };
}

export async function applyPromisePatch(projectName: string, inputId: string): Promise<{ ok: true; changed_files: string[]; skipped: string[] }> {
  const root = projectRoot(projectName);
  const patchPath = path.join(root, "01_intake", inputId, "promise_ledger_update.yaml");
  if (!(await pathExists(patchPath))) {
    throw new Error(`Promise ledger update not found: 01_intake/${inputId}/promise_ledger_update.yaml`);
  }

  const patch = PromisePatchSchema.parse(await readYaml(patchPath));
  const ledger = await readPromiseLedger(projectName);
  const skipped: string[] = [];

  for (const operation of patch.operations) {
    if (operation.op === "add_candidate" && operation.promise) {
      const promise = operation.promise;
      if (promise.origin === "ai_inference" && promise.confidence < 0.75) {
        skipped.push(`${promise.id}: low_confidence_ai_inference`);
        continue;
      }
      upsertPromise(ledger, { ...promise, updated_at: nowIso() });
      continue;
    }

    const existing = ledger.promises.find((item) => item.id === operation.promise_id);
    if (!existing) {
      skipped.push(`${operation.promise_id}: missing_promise`);
      continue;
    }
    existing.last_touched_chapter = existing.last_touched_chapter ?? existing.source_chapter;
    existing.updated_at = nowIso();
    if (operation.op === "pay_candidate") {
      existing.status = "paid";
      existing.payoff_mode = operation.payoff_mode ?? "direct";
      existing.payoff_quality = operation.payoff_quality ?? "unknown";
    } else if (operation.op === "transform_candidate") {
      existing.status = "transformed";
      existing.payoff_mode = operation.payoff_mode ?? "substitution";
    } else if (operation.op === "drop_candidate") {
      existing.status = "dropped_candidate";
      existing.tension_policy = "drop";
    } else if (operation.op === "touch" && existing.status === "open") {
      existing.status = "delayed";
    }
  }

  await writePromiseLedger(projectName, ledger);
  await appendTrace(projectName, {
    command: "promise.apply-patch",
    input_id: inputId,
    artifacts: ["30_plot/promise_ledger.yaml"],
    warnings: skipped,
    metadata: { patch_id: patch.patch_id },
  });
  return { ok: true, changed_files: ["30_plot/promise_ledger.yaml"], skipped };
}

export async function confirmPromise(projectName: string, promiseId: string): Promise<{ ok: true; changed_files: string[] }> {
  return updatePromise(projectName, promiseId, (promise) => {
    if (promise.status === "dropped_candidate") promise.status = "open";
    promise.updated_at = nowIso();
  }, "promise.confirm");
}

export async function payPromise(
  projectName: string,
  promiseId: string,
  mode: string,
  quality: string,
): Promise<{ ok: true; changed_files: string[] }> {
  const payoffMode = PayoffModeSchema.parse(mode);
  const payoffQuality = PayoffQualitySchema.parse(quality);
  return updatePromise(projectName, promiseId, (promise) => {
    promise.status = "paid";
    promise.payoff_mode = payoffMode;
    promise.payoff_quality = payoffQuality;
    promise.updated_at = nowIso();
  }, "promise.pay");
}

export async function transformPromise(
  projectName: string,
  promiseId: string,
  intoPromiseId: string,
): Promise<{ ok: true; changed_files: string[] }> {
  return updatePromise(projectName, promiseId, (promise) => {
    promise.status = "transformed";
    promise.payoff_mode = "substitution";
    promise.author_intended_strategy = promise.author_intended_strategy ?? `转入新的期待：${intoPromiseId}`;
    promise.updated_at = nowIso();
  }, "promise.transform");
}

export async function dropPromise(projectName: string, promiseId: string, reason: string): Promise<{ ok: true; changed_files: string[] }> {
  return updatePromise(projectName, promiseId, (promise) => {
    promise.status = "abandoned";
    promise.payoff_mode = "abandoned_by_author";
    promise.tension_policy = "drop";
    promise.author_intended_strategy = reason;
    promise.updated_at = nowIso();
  }, "promise.drop");
}

async function updatePromise(
  projectName: string,
  promiseId: string,
  mutate: (promise: PromiseEntry) => void,
  command: string,
): Promise<{ ok: true; changed_files: string[] }> {
  const ledger = await readPromiseLedger(projectName);
  const promise = ledger.promises.find((item) => item.id === promiseId);
  if (!promise) throw new Error(`Promise not found: ${promiseId}`);
  mutate(promise);
  PromiseStatusSchema.parse(promise.status);
  await writePromiseLedger(projectName, ledger);
  await appendTrace(projectName, {
    command,
    artifacts: ["30_plot/promise_ledger.yaml"],
    metadata: { promise_id: promiseId },
  });
  return { ok: true, changed_files: ["30_plot/promise_ledger.yaml"] };
}

async function readPromiseLedger(projectName: string): Promise<PromiseLedger> {
  const root = projectRoot(projectName);
  const ledgerPath = path.join(root, "30_plot/promise_ledger.yaml");
  if (!(await pathExists(ledgerPath))) {
    await migrateWebnovelGene(projectName);
  }
  return PromiseLedgerSchema.parse(await readYaml(ledgerPath));
}

async function writePromiseLedger(projectName: string, ledger: PromiseLedger): Promise<void> {
  ledger.updated_at = nowIso();
  PromiseLedgerSchema.parse(ledger);
  await writeYaml(path.join(projectRoot(projectName), "30_plot/promise_ledger.yaml"), ledger);
}

function upsertPromise(ledger: PromiseLedger, promise: PromiseEntry): void {
  const index = ledger.promises.findIndex((item) => item.id === promise.id);
  if (index >= 0) {
    ledger.promises[index] = promise;
  } else {
    ledger.promises.push(promise);
  }
}
