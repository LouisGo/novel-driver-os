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
  .description("Copy a Markdown/TXT input into raw inbox and generate an Author Input Packet.")
  .action(wrap(async (projectName: string, filePath: string) => {
    const packet = await ingestInput(projectName, filePath);
    console.log(`Ingested ${packet.input_id}`);
    console.log(`detected_type: ${packet.detected_type}`);
    console.log(`authority_level: ${packet.authority_level}`);
    console.log(`status: ${packet.status}`);
  }));

program
  .command("list-inputs")
  .argument("<projectName>")
  .description("List Author Input Packets.")
  .action(wrap(async (projectName: string) => {
    const packets = await listInputs(projectName);
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
  .description("Show one Author Input Packet.")
  .action(wrap(async (projectName: string, inputId: string) => {
    const { packet } = await findPacket(projectName, inputId);
    console.log(reviewPacket(packet));
  }));

program
  .command("ignore-input")
  .argument("<projectName>")
  .argument("<inputId>")
  .description("Move an input packet to ignored state.")
  .action(wrap(async (projectName: string, inputId: string) => {
    const packet = await ignoreInput(projectName, inputId);
    console.log(`Ignored ${packet.input_id}`);
  }));

const intake = program.command("intake").description("Creative intake commands.");

intake
  .command("chapter")
  .argument("<projectName>")
  .argument("<inputId>")
  .description("Create a Creative Intake Capsule from a chapter or fragment input.")
  .action(wrap(async (projectName: string, inputId: string) => {
    const result = await createChapterIntake(projectName, inputId);
    console.log(`Created intake capsule: ${path.relative(process.cwd(), result.intakeDir)}`);
    console.log(`vibe hypotheses: ${result.hypothesisIds.join(", ")}`);
  }));

program
  .command("confirm-vibe")
  .argument("<projectName>")
  .argument("<inputId>")
  .argument("<hypothesisId>")
  .description("Confirm one atmosphere hypothesis and move the others to tentative vibes.")
  .action(wrap(async (projectName: string, inputId: string, hypothesisId: string) => {
    await confirmVibe(projectName, inputId, hypothesisId);
    console.log(`Confirmed ${hypothesisId} for ${inputId}`);
  }));

const debt = program.command("debt").description("Retcon debt ledger commands.");

debt
  .command("add")
  .argument("<projectName>")
  .requiredOption("--chapter <chapter>")
  .requiredOption("--issue <issue>")
  .requiredOption("--solution <solution>")
  .option("--severity <severity>", "low | medium | high", "low")
  .description("Add one accepted retcon debt entry.")
  .action(wrap(async (projectName: string, options: { chapter: string; issue: string; solution: string; severity: string }) => {
    await addDebt(projectName, options);
    console.log(`Added retcon debt for ${options.chapter}`);
  }));

debt
  .command("report")
  .argument("<projectName>")
  .description("Print retcon debt report.")
  .action(wrap(async (projectName: string) => {
    console.log(await debtReport(projectName));
  }));

const style = program.command("style").description("Style evolution commands.");

style
  .command("candidate")
  .argument("<projectName>")
  .argument("<inputId>")
  .description("Generate or append a style candidate from an input or intake.")
  .action(wrap(async (projectName: string, inputId: string) => {
    const file = await createStyleCandidate(projectName, inputId);
    console.log(`Wrote style candidate: ${path.relative(process.cwd(), file)}`);
  }));

const ghost = program.command("ghost").description("Ghost Premise Resonator commands.");

ghost
  .command("scan")
  .argument("<projectName>")
  .description("Scan discarded brilliance against current project state.")
  .action(wrap(async (projectName: string) => {
    const file = await ghostScan(projectName);
    console.log(`Wrote ghost report: ${path.relative(process.cwd(), file)}`);
  }));

const harden = program.command("harden").description("Memory hardening commands.");

harden
  .command("volume")
  .argument("<projectName>")
  .argument("<volumeId>")
  .description("Generate cold/warm volume hardening outputs without deleting source files.")
  .action(wrap(async (projectName: string, volumeId: string) => {
    const dir = await hardenVolume(projectName, volumeId);
    console.log(`Wrote hardening output: ${path.relative(process.cwd(), dir)}`);
  }));

const align = program.command("align").description("Author alignment commands.");

align
  .command("weekly")
  .argument("<projectName>")
  .description("Generate a weekly alignment report.")
  .action(wrap(async (projectName: string) => {
    const file = await weeklyAlignment(projectName);
    console.log(`Wrote alignment report: ${path.relative(process.cwd(), file)}`);
  }));

const context = program.command("context").description("Context assembler commands.");

context
  .command("build")
  .argument("<projectName>")
  .requiredOption("--chapter <chapter>")
  .description("Build a context packet for a future chapter without reading full manuscript.")
  .action(wrap(async (projectName: string, options: { chapter: string }) => {
    const file = await buildContextPacket(projectName, options.chapter);
    console.log(`Wrote context packet: ${path.relative(process.cwd(), file)}`);
  }));

program
  .command("validate")
  .argument("<projectName>")
  .description("Validate project directories, files, YAML, schemas and input states.")
  .action(wrap(async (projectName: string) => {
    const result = await validateProject(projectName);
    console.log(formatValidation(result));
    if (!result.ok) process.exitCode = 1;
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
