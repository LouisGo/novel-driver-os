#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { initProject } from "./project.js";
import { ingestInput, ignoreInput, listInputs, reviewPacket, findPacket } from "./input.js";
import { confirmVibe, createChapterIntake } from "./intake.js";
import { addDebt, debtReport } from "./debt.js";
import { createStyleCandidate } from "./style.js";
import { ghostScan } from "./ghost.js";
import { hardenVolume } from "./harden.js";
import { weeklyAlignment } from "./alignment.js";
import { buildContextPacket } from "./context.js";
import { formatValidation, validateProject } from "./validate.js";
import { routeInput } from "./route.js";
import { decideReview, getReviewDetail, listPendingApply, listReviewQueue } from "./review.js";
import { applyMemoryPatch, rejectMemoryPatch } from "./patch.js";
import { getProjectStatus } from "./status.js";

const program = new Command();

program
  .name("novel")
  .description("Novel Driver OS file-system first CLI MVP")
  .version("0.1.0");

program
  .command("init")
  .argument("<projectName>")
  .description("Initialize a Novel Driver OS project under projects/<projectName>.")
  .action(wrap(async (projectName: string) => {
    const root = await initProject(projectName);
    console.log(`Initialized project: ${path.relative(process.cwd(), root)}`);
  }));

program
  .command("ingest")
  .argument("<projectName>")
  .argument("<filePath>")
  .option("--json", "Print machine-readable JSON.")
  .description("Copy a Markdown/TXT input into raw inbox and generate an Author Input Packet.")
  .action(wrap(async (projectName: string, filePath: string, options: { json?: boolean }) => {
    const packet = await ingestInput(projectName, filePath);
    if (options.json) {
      printJson({ ok: true, packet });
      return;
    }
    console.log(`Ingested ${packet.input_id}`);
    console.log(`detected_type: ${packet.detected_type}`);
    console.log(`authority_level: ${packet.authority_level}`);
    console.log(`status: ${packet.status}`);
  }));

program
  .command("list-inputs")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("List Author Input Packets.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const packets = await listInputs(projectName);
    if (options.json) {
      printJson({ ok: true, packets });
      return;
    }
    if (packets.length === 0) {
      console.log("No inputs found.");
      return;
    }
    for (const packet of packets) {
      console.log(`${packet.input_id}\t${packet.detected_type}\t${packet.status}\t${packet.authority_level}\t${packet.target_scope.chapter ?? "-"}`);
    }
  }));

program
  .command("review-input")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Show one Author Input Packet.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const { packet } = await findPacket(projectName, inputId);
    if (options.json) {
      printJson({ ok: true, packet });
      return;
    }
    console.log(reviewPacket(packet));
  }));

program
  .command("ignore-input")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Move an input packet to ignored state.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const packet = await ignoreInput(projectName, inputId);
    if (options.json) {
      printJson({ ok: true, packet });
      return;
    }
    console.log(`Ignored ${packet.input_id}`);
  }));

program
  .command("route")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Create a route plan and move a triaged input to routed state.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const result = await routeInput(projectName, inputId);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Routed ${inputId}: ${result.route_plan.primary_route}`);
    if (result.route_plan.next_commands.length > 0) {
      console.log(`next: ${result.route_plan.next_commands.join(" && ")}`);
    }
    if (result.warnings.length > 0) {
      console.log(`warnings: ${result.warnings.join(", ")}`);
    }
  }));

const review = program.command("review").description("Author review and confirmation queue commands.");

review
  .command("queue")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("List inputs waiting for an author decision.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const queue = await listReviewQueue(projectName);
    if (options.json) {
      printJson({ ok: true, queue });
      return;
    }
    if (queue.length === 0) {
      console.log("No inputs waiting for review.");
      return;
    }
    for (const item of queue) {
      console.log(`${item.input_id}\t${item.detected_type}\t${item.authority_level}\t${item.target_scope.chapter ?? "-"}`);
    }
  }));

review
  .command("pending-apply")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("List approved inputs waiting for patch apply.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const pending = await listPendingApply(projectName);
    if (options.json) {
      printJson({ ok: true, pending_apply: pending });
      return;
    }
    if (pending.length === 0) {
      console.log("No approved inputs waiting for apply.");
      return;
    }
    for (const item of pending) {
      console.log(`${item.input_id}\t${item.detected_type}\t${item.authority_level}\t${item.target_scope.chapter ?? "-"}`);
    }
  }));

review
  .command("detail")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Show packet, route plan, review decision and generated artifacts.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const detail = await getReviewDetail(projectName, inputId);
    if (options.json) {
      printJson({ ok: true, detail });
      return;
    }
    console.log(reviewPacket(detail.packet));
    if (detail.route_plan) {
      console.log(`route: ${detail.route_plan.primary_route}`);
      console.log(`next: ${detail.route_plan.next_commands.join(" && ") || "-"}`);
    }
    if (detail.decision) console.log(`decision: ${detail.decision.decision}`);
    if (detail.artifacts.length > 0) console.log(`artifacts:\n${detail.artifacts.map((file) => `- ${file}`).join("\n")}`);
  }));

review
  .command("decide")
  .argument("<projectName>")
  .argument("<inputId>")
  .requiredOption("--decision <decision>", "approve | reject | archive")
  .option("--note <note>")
  .option("--json", "Print machine-readable JSON.")
  .description("Record an author decision for a pending input.")
  .action(wrap(async (
    projectName: string,
    inputId: string,
    options: { decision: "approve" | "reject" | "archive"; note?: string; json?: boolean },
  ) => {
    const result = await decideReview(projectName, inputId, options.decision, options.note ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Decision recorded for ${inputId}: ${result.decision.decision}`);
    if (result.next_commands.length > 0) console.log(`next: ${result.next_commands.join(" && ")}`);
  }));

const intake = program.command("intake").description("Creative intake commands.");

intake
  .command("chapter")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Create a Creative Intake Capsule from a chapter or fragment input.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const result = await createChapterIntake(projectName, inputId);
    if (options.json) {
      printJson({ ok: true, ...result, changed_files: result.hypothesisIds.length > 0 ? [`01_intake/${inputId}`] : [] });
      return;
    }
    console.log(`Created intake capsule: ${path.relative(process.cwd(), result.intakeDir)}`);
    console.log(`vibe hypotheses: ${result.hypothesisIds.join(", ")}`);
  }));

program
  .command("confirm-vibe")
  .argument("<projectName>")
  .argument("<inputId>")
  .argument("<hypothesisId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Confirm one atmosphere hypothesis and move the others to tentative vibes.")
  .action(wrap(async (projectName: string, inputId: string, hypothesisId: string, options: { json?: boolean }) => {
    await confirmVibe(projectName, inputId, hypothesisId);
    if (options.json) {
      printJson({
        ok: true,
        input_id: inputId,
        hypothesis_id: hypothesisId,
        changed_files: [
          `01_intake/${inputId}/confirmed_vibes.md`,
          `01_intake/${inputId}/tentative_vibes.md`,
        ],
      });
      return;
    }
    console.log(`Confirmed ${hypothesisId} for ${inputId}`);
  }));

const patch = program.command("patch").description("Memory patch approval/application commands.");

patch
  .command("apply")
  .argument("<projectName>")
  .argument("<inputId>")
  .requiredOption("--target <target>", "all | canon | character | plot | style | ambiguity")
  .option("--json", "Print machine-readable JSON.")
  .description("Apply an approved memory patch to project memory files.")
  .action(wrap(async (projectName: string, inputId: string, options: { target: string; json?: boolean }) => {
    const result = await applyMemoryPatch(projectName, inputId, options.target);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Applied ${result.patch_id} to ${result.target}`);
    if (result.changed_files.length > 0) console.log(`changed:\n${result.changed_files.map((file) => `- ${file}`).join("\n")}`);
    if (result.next_commands.length > 0) console.log(`next: ${result.next_commands.join(" && ")}`);
  }));

patch
  .command("reject")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--reason <reason>")
  .option("--json", "Print machine-readable JSON.")
  .description("Reject a pending memory patch and archive its input.")
  .action(wrap(async (projectName: string, inputId: string, options: { reason?: string; json?: boolean }) => {
    const result = await rejectMemoryPatch(projectName, inputId, options.reason ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Rejected patch for ${inputId}`);
  }));

const debt = program.command("debt").description("Retcon debt ledger commands.");

debt
  .command("add")
  .argument("<projectName>")
  .requiredOption("--chapter <chapter>")
  .requiredOption("--issue <issue>")
  .requiredOption("--solution <solution>")
  .option("--severity <severity>", "low | medium | high", "low")
  .option("--json", "Print machine-readable JSON.")
  .description("Add one accepted retcon debt entry.")
  .action(wrap(async (projectName: string, options: { chapter: string; issue: string; solution: string; severity: string; json?: boolean }) => {
    await addDebt(projectName, options);
    if (options.json) {
      printJson({ ok: true, changed_files: ["70_debt/retcon_debt.yaml"] });
      return;
    }
    console.log(`Added retcon debt for ${options.chapter}`);
  }));

debt
  .command("report")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Print retcon debt report.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const report = await debtReport(projectName);
    if (options.json) {
      printJson({ ok: true, report });
      return;
    }
    console.log(report);
  }));

const style = program.command("style").description("Style evolution commands.");

style
  .command("candidate")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Generate or append a style candidate from an input or intake.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const file = await createStyleCandidate(projectName, inputId);
    if (options.json) {
      printJson({ ok: true, changed_files: [path.relative(process.cwd(), file)] });
      return;
    }
    console.log(`Wrote style candidate: ${path.relative(process.cwd(), file)}`);
  }));

const ghost = program.command("ghost").description("Ghost Premise Resonator commands.");

ghost
  .command("scan")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Scan discarded brilliance against current project state.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const file = await ghostScan(projectName);
    if (options.json) {
      printJson({ ok: true, changed_files: [path.relative(process.cwd(), file)] });
      return;
    }
    console.log(`Wrote ghost report: ${path.relative(process.cwd(), file)}`);
  }));

const harden = program.command("harden").description("Memory hardening commands.");

harden
  .command("volume")
  .argument("<projectName>")
  .argument("<volumeId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Generate cold/warm volume hardening outputs without deleting source files.")
  .action(wrap(async (projectName: string, volumeId: string, options: { json?: boolean }) => {
    const dir = await hardenVolume(projectName, volumeId);
    if (options.json) {
      printJson({ ok: true, changed_files: [path.relative(process.cwd(), dir)] });
      return;
    }
    console.log(`Wrote hardening output: ${path.relative(process.cwd(), dir)}`);
  }));

const align = program.command("align").description("Author alignment commands.");

align
  .command("weekly")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Generate a weekly alignment report.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const file = await weeklyAlignment(projectName);
    if (options.json) {
      printJson({ ok: true, changed_files: [path.relative(process.cwd(), file)] });
      return;
    }
    console.log(`Wrote alignment report: ${path.relative(process.cwd(), file)}`);
  }));

const context = program.command("context").description("Context assembler commands.");

context
  .command("build")
  .argument("<projectName>")
  .requiredOption("--chapter <chapter>")
  .option("--json", "Print machine-readable JSON.")
  .description("Build a context packet for a future chapter without reading full manuscript.")
  .action(wrap(async (projectName: string, options: { chapter: string; json?: boolean }) => {
    const file = await buildContextPacket(projectName, options.chapter);
    if (options.json) {
      printJson({ ok: true, changed_files: [path.relative(process.cwd(), file)] });
      return;
    }
    console.log(`Wrote context packet: ${path.relative(process.cwd(), file)}`);
  }));

program
  .command("validate")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Validate project directories, files, YAML, schemas and input states.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const result = await validateProject(projectName);
    if (options.json) {
      printJson({ ok: result.ok, validation: result });
      if (!result.ok) process.exitCode = 1;
      return;
    }
    console.log(formatValidation(result));
    if (!result.ok) process.exitCode = 1;
  }));

program
  .command("status")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Show project loop status for CLI and GUI orchestration.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const status = await getProjectStatus(projectName);
    if (options.json) {
      printJson({ ok: true, status });
      return;
    }
    console.log(`Project: ${status.project}`);
    console.log(`validation: ${status.validation.ok ? "valid" : "invalid"}`);
    console.log(`review_queue: ${status.review_queue.length}`);
    console.log(`pending_apply: ${status.pending_apply.length}`);
    console.log(`context_packets: ${status.context_packets.length}`);
  }));

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(1);
});

function wrap<T extends unknown[]>(fn: (...args: T) => Promise<void>): (...args: T) => void {
  return (...args: T) => {
    fn(...args).catch((error: unknown) => {
      console.error((error as Error).message);
      process.exitCode = 1;
    });
  };
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}
