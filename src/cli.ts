#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { initProject } from "./project.js";
import { ingestInput, ingestText, ignoreInput, listInputs, reviewPacket, findPacket, SourceActor } from "./input.js";
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
import { createMemoryProposal } from "./propose.js";
import { acceptChapter } from "./chapter.js";
import { exportChapters } from "./exporter.js";
import { compareVariants, decideVariant, registerVariant } from "./variant.js";
import { getSessionStatus, pauseSession, resumeSession } from "./session.js";
import { createSnapshot, restoreSnapshot } from "./snapshot.js";
import { initProjectGit } from "./project-git.js";
import { setBookProfile, showBookProfile } from "./book.js";
import { createStorycraftArtifact, listStorycraftArtifacts, readStorycraftArtifact } from "./storycraft.js";
import { StorycraftKind, StorycraftKindSchema } from "./schemas.js";
import { inputStatusLabel, inputTypeLabel, storycraftKindLabel } from "./display.js";

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
  .argument("[filePath]")
  .option("--stdin", "Read input text from stdin.")
  .option("--source-actor <actor>", "human | agent | model", "human")
  .option("--supersedes <inputId>", "Record that this input supersedes a previous input.")
  .option("--json", "Print machine-readable JSON.")
  .description("Copy a Markdown/TXT input into raw inbox and generate an Author Input Packet.")
  .action(wrap(async (projectName: string, filePath: string | undefined, options: { stdin?: boolean; sourceActor: SourceActor; supersedes?: string; json?: boolean }) => {
    const packet = options.stdin
      ? await ingestText(projectName, await readStdin(), {
        sourceActor: options.sourceActor,
        sourceChannel: "stdin",
        rawNameHint: "stdin.md",
        supersedesInputId: options.supersedes ?? null,
      })
      : filePath
        ? await ingestInput(projectName, filePath, { sourceActor: options.sourceActor, supersedesInputId: options.supersedes ?? null })
        : (() => { throw new Error("ingest requires <filePath> unless --stdin is set."); })();
    if (options.json) {
      printJson({ ok: true, packet });
      return;
    }
    console.log(`已接收输入：${packet.input_id}`);
    console.log(`分类：${inputTypeLabel(packet.detected_type)}`);
    console.log(`状态：${inputStatusLabel(packet.status)}`);
    console.log(`需要确认：${packet.requires_confirmation ? "是" : "否"}`);
  }));

program
  .command("propose")
  .argument("<projectName>")
  .argument("<inputId>")
  .requiredOption("--kind <kind>", "character | setting | worldbuilding | outline | ambiguity")
  .option("--json", "Print machine-readable JSON.")
  .description("Generate a memory patch proposal for non-chapter inputs.")
  .action(wrap(async (projectName: string, inputId: string, options: { kind: string; json?: boolean }) => {
    const result = await createMemoryProposal(projectName, inputId, options.kind);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Created ${result.kind} proposal for ${inputId}`);
    console.log(`next: ${result.next_commands.join(" && ")}`);
  }));

const book = program.command("book").description("Book profile commands.");

book
  .command("set")
  .argument("<projectName>")
  .requiredOption("--title <title>")
  .requiredOption("--synopsis <synopsis>")
  .option("--genre <genre>")
  .option("--tags <tags>", "Comma-separated tags.")
  .option("--source-input <inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Set the book title and synopsis used by export and context.")
  .action(wrap(async (projectName: string, options: { title: string; synopsis: string; genre?: string; tags?: string; sourceInput?: string; json?: boolean }) => {
    const result = await setBookProfile(projectName, {
      title: options.title,
      synopsis: options.synopsis,
      genre: options.genre ?? null,
      tags: options.tags ? options.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
      sourceInput: options.sourceInput ?? null,
    });
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Book title: ${result.profile.title}`);
  }));

book
  .command("show")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Show the current book profile.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const result = await showBookProfile(projectName);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`title: ${result.profile.title}`);
    console.log(`synopsis: ${result.profile.synopsis || "-"}`);
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
      console.log("暂无输入。");
      return;
    }
    for (const packet of packets) {
      console.log(`${packet.input_id}\t${inputTypeLabel(packet.detected_type)}\t${inputStatusLabel(packet.status)}\t${packet.target_scope.chapter ?? "-"}`);
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
      console.log("暂无等待确认的内容。");
      return;
    }
    for (const item of queue) {
      console.log(`${item.input_id}\t${inputTypeLabel(item.detected_type)}\t${item.target_scope.chapter ?? "-"}`);
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
      console.log("暂无已确认但未写入的内容。");
      return;
    }
    for (const item of pending) {
      console.log(`${item.input_id}\t${inputTypeLabel(item.detected_type)}\t${item.target_scope.chapter ?? "-"}`);
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

const chapter = program.command("chapter").description("Accepted chapter commands.");

chapter
  .command("accept")
  .argument("<projectName>")
  .argument("<inputId>")
  .requiredOption("--chapter <chapter>")
  .option("--layer <layer>", "hot | warm | cold", "hot")
  .option("--variant <variantId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Accept an approved chapter or winning variant into 50_chapters/<layer>.")
  .action(wrap(async (projectName: string, inputId: string, options: { chapter: string; layer: string; variant?: string; json?: boolean }) => {
    const result = await acceptChapter(projectName, inputId, options.chapter, options.layer, options.variant ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Accepted ${options.chapter} into ${result.layer}`);
  }));

const exportCommand = program.command("export").description("Export project artifacts.");

exportCommand
  .command("chapters")
  .argument("<projectName>")
  .requiredOption("--format <format>", "txt")
  .option("--out <dir>")
  .option("--zip <file>")
  .option("--json", "Print machine-readable JSON.")
  .description("Export accepted hot chapters in chapter_index order. Defaults to Chinese book-title paths under exports/.")
  .action(wrap(async (projectName: string, options: { format: string; out?: string; zip?: string; json?: boolean }) => {
    const result = await exportChapters(projectName, options);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Exported ${result.exported_files.length} chapters`);
    if (result.zip_file) console.log(`zip: ${result.zip_file}`);
  }));

const variant = program.command("variant").description("Chapter variant comparison workflow.");

variant
  .command("register")
  .argument("<projectName>")
  .argument("<inputId>")
  .requiredOption("--from-file <file>")
  .requiredOption("--label <label>")
  .option("--chapter <chapter>")
  .option("--json", "Print machine-readable JSON.")
  .description("Register a candidate chapter variant file.")
  .action(wrap(async (projectName: string, inputId: string, options: { fromFile: string; label: string; chapter?: string; json?: boolean }) => {
    const result = await registerVariant(projectName, inputId, options.fromFile, options.label, options.chapter ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Registered ${result.variant.variant_id}`);
  }));

variant
  .command("compare")
  .argument("<projectName>")
  .argument("<inputId>")
  .option("--json", "Print machine-readable JSON.")
  .description("Generate a fixed-dimension variant comparison report.")
  .action(wrap(async (projectName: string, inputId: string, options: { json?: boolean }) => {
    const result = await compareVariants(projectName, inputId);
    if (options.json) {
      printJson({ ok: true, changed_files: result.changed_files });
      return;
    }
    console.log(`Wrote variant compare report: ${result.changed_files.join(", ")}`);
  }));

variant
  .command("decide")
  .argument("<projectName>")
  .argument("<inputId>")
  .requiredOption("--variant <variantId>")
  .option("--note <note>")
  .option("--json", "Print machine-readable JSON.")
  .description("Mark one registered variant as the winner.")
  .action(wrap(async (projectName: string, inputId: string, options: { variant: string; note?: string; json?: boolean }) => {
    const result = await decideVariant(projectName, inputId, options.variant, options.note ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Winner: ${result.winner_variant_id}`);
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

const storycraft = program.command("storycraft").description("Commercial storycraft artifact commands.");

for (const kind of ["premise", "payoff", "emotion", "brief"] as StorycraftKind[]) {
  const command = storycraft.command(kind).description(`${kind} storycraft artifacts.`);

  command
    .command("create")
    .argument("<projectName>")
    .option("--from-file <file>")
    .option("--stdin", "Read artifact content from stdin.")
    .option("--source-input <inputId>")
    .option("--chapter <chapter>")
    .option("--volume <volume>")
    .option("--entity <entity>")
    .option("--label <label>")
    .option("--summary <summary>")
    .option("--source-actor <actor>", "human | agent | model", "agent")
    .option("--json", "Print machine-readable JSON.")
    .description(`Register a ${kind} report/brief generated by the author, agent or model.`)
    .action(wrap(async (projectName: string, options: {
      fromFile?: string;
      stdin?: boolean;
      sourceInput?: string;
      chapter?: string;
      volume?: string;
      entity?: string;
      label?: string;
      summary?: string;
      sourceActor: "human" | "agent" | "model";
      json?: boolean;
    }) => {
      const parsedKind = StorycraftKindSchema.parse(kind);
      const result = await createStorycraftArtifact(projectName, parsedKind, {
        fromFile: options.fromFile,
        stdinText: options.stdin ? await readStdin() : undefined,
        sourceInput: options.sourceInput ?? null,
        chapter: options.chapter ?? null,
        volume: options.volume ?? null,
        entity: options.entity ?? null,
        label: options.label ?? null,
        summary: options.summary ?? null,
        sourceActor: options.sourceActor,
      });
      if (options.json) {
        printJson(result);
        return;
      }
      console.log(`已登记${storycraftKindLabel(result.artifact.kind)}：${result.artifact.artifact_id}`);
      console.log(`内容文件：${result.artifact.content_file}`);
    }));

  command
    .command("list")
    .argument("<projectName>")
    .option("--json", "Print machine-readable JSON.")
    .description(`List ${kind} storycraft artifacts.`)
    .action(wrap(async (projectName: string, options: { json?: boolean }) => {
      const parsedKind = StorycraftKindSchema.parse(kind);
      const artifacts = await listStorycraftArtifacts(projectName, parsedKind);
      if (options.json) {
        printJson({ ok: true, artifacts });
        return;
      }
      for (const artifact of artifacts) {
        console.log(`${artifact.artifact_id}\t${artifact.label}\t${artifact.target_scope.chapter ?? "-"}\t${artifact.created_at}`);
      }
    }));

  command
    .command("show")
    .argument("<projectName>")
    .argument("<artifactId>")
    .option("--json", "Print machine-readable JSON.")
    .description(`Show one ${kind} storycraft artifact.`)
    .action(wrap(async (projectName: string, artifactId: string, options: { json?: boolean }) => {
      const parsedKind = StorycraftKindSchema.parse(kind);
      const artifact = await readStorycraftArtifact(projectName, parsedKind, artifactId);
      if (options.json) {
        printJson({ ok: true, artifact });
        return;
      }
      console.log(artifact.content);
    }));
}

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

const session = program.command("session").description("Pause/resume loop ledger commands.");

session
  .command("status")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const result = await getSessionStatus(projectName);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`session: ${result.session.state}`);
    console.log(`review_queue: ${result.project_status.review_queue.length}`);
    console.log(`pending_apply: ${result.project_status.pending_apply.length}`);
  }));

session
  .command("pause")
  .argument("<projectName>")
  .option("--note <note>")
  .option("--json", "Print machine-readable JSON.")
  .action(wrap(async (projectName: string, options: { note?: string; json?: boolean }) => {
    const result = await pauseSession(projectName, options.note ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log("Session paused.");
  }));

session
  .command("resume")
  .argument("<projectName>")
  .option("--note <note>")
  .option("--json", "Print machine-readable JSON.")
  .action(wrap(async (projectName: string, options: { note?: string; json?: boolean }) => {
    const result = await resumeSession(projectName, options.note ?? null);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log("Session resumed.");
  }));

const snapshot = program.command("snapshot").description("Project snapshot commands.");

snapshot
  .command("create")
  .argument("<projectName>")
  .requiredOption("--label <label>")
  .option("--json", "Print machine-readable JSON.")
  .action(wrap(async (projectName: string, options: { label: string; json?: boolean }) => {
    const result = await createSnapshot(projectName, options.label);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Snapshot: ${result.snapshot_id}`);
  }));

snapshot
  .command("restore")
  .argument("<projectName>")
  .argument("<snapshotId>")
  .option("--json", "Print machine-readable JSON.")
  .action(wrap(async (projectName: string, snapshotId: string, options: { json?: boolean }) => {
    const result = await restoreSnapshot(projectName, snapshotId);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Restored ${result.snapshot_id}`);
  }));

const project = program.command("project").description("Project maintenance commands.");

project
  .command("git-init")
  .argument("<projectName>")
  .option("--json", "Print machine-readable JSON.")
  .description("Initialize project-local git inside projects/<projectName>.")
  .action(wrap(async (projectName: string, options: { json?: boolean }) => {
    const result = await initProjectGit(projectName);
    if (options.json) {
      printJson(result);
      return;
    }
    console.log(`Initialized project git: ${result.cwd}`);
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

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
