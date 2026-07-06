import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import YAML from "yaml";
import { initProject } from "../src/project.js";
import { ingestInput } from "../src/input.js";
import { confirmVibe, createChapterIntake } from "../src/intake.js";
import { buildContextPacket } from "../src/context.js";
import { hardenVolume } from "../src/harden.js";
import { validateProject } from "../src/validate.js";
import { ghostScan } from "../src/ghost.js";
import { routeInput } from "../src/route.js";
import { decideReview, listPendingApply, listReviewQueue } from "../src/review.js";
import { applyMemoryPatch } from "../src/patch.js";
import { getProjectStatus } from "../src/status.js";
import { readTraceTail } from "../src/trace.js";

test("validator rejects intention and retcon debt protocol violations", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const packet = await ingestChapter(root);
    await createChapterIntake("black_tower", packet.input_id);

    const intentPath = path.join(root, "projects/black_tower/01_intake", packet.input_id, "intention_hypotheses.yaml");
    const intentions = YAML.parse(await fs.readFile(intentPath, "utf8"));
    const weakGuess = intentions.intention_hypotheses.find((item: { level: string }) => item.level === "L3_weak_guess");
    weakGuess.ttl = "permanent";
    weakGuess.can_enter_decision_log = true;
    await fs.writeFile(intentPath, YAML.stringify(intentions), "utf8");

    const debtPath = path.join(root, "projects/black_tower/70_debt/retcon_debt.yaml");
    await fs.writeFile(debtPath, YAML.stringify({
      current_arc_total: 1,
      last_10_chapters: 1,
      threshold: 3,
      entries: [{
        chapter: "ch0050",
        issue: "bad patch",
        accepted_solution: "patch anyway",
        debt_type: "continuity_patch",
        severity: "catastrophic",
      }],
    }), "utf8");

    const result = await validateProject("black_tower");
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /L3 weak guesses/);
    assert.match(result.errors.join("\n"), /severity|Invalid enum value/);
  });
});

test("confirmed vibes lose tentative metadata and tentative context expires", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const packet = await ingestChapter(root);
    await createChapterIntake("black_tower", packet.input_id);
    await confirmVibe("black_tower", packet.input_id, "vibe_a");

    const intakeDir = path.join(root, "projects/black_tower/01_intake", packet.input_id);
    const confirmed = await fs.readFile(path.join(intakeDir, "confirmed_vibes.md"), "utf8");
    assert.match(confirmed, /requires_confirmation:\s*false/);
    assert.match(confirmed, /status:\s*confirmed/);
    assert.doesNotMatch(confirmed, /status:\s*tentative/);

    const nearContext = await fs.readFile(await buildContextPacket("black_tower", "ch0051"), "utf8");
    assert.match(nearContext, /Short-Term Tentative Vibes/);
    assert.match(nearContext, /vibe_b/);

    const farContext = await fs.readFile(await buildContextPacket("black_tower", "ch0054"), "utf8");
    assert.doesNotMatch(farContext, /vibe_b/);
  });
});

test("chapter intake writes a chapter quality review", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const packet = await ingestChapter(root);
    await createChapterIntake("black_tower", packet.input_id);

    const factDeltaPath = path.join(root, "projects/black_tower/01_intake", packet.input_id, "fact_delta.yaml");
    const factDelta = YAML.parse(await fs.readFile(factDeltaPath, "utf8"));
    assert.ok(
      factDelta.new_facts.some((item: string) => item.includes("她没有回头，只是把伞往他那边偏了半寸")),
      YAML.stringify(factDelta),
    );
    assert.doesNotMatch(factDelta.new_facts.join("\n"), /作者提交了/);
    assert.ok(
      factDelta.hooks_opened.some((item: string) => /别死|生死|关系/.test(item)),
      YAML.stringify(factDelta),
    );

    const memoryPatchPath = path.join(root, "projects/black_tower/01_intake", packet.input_id, "memory_patch.yaml");
    const memoryPatch = YAML.parse(await fs.readFile(memoryPatchPath, "utf8"));
    assert.match(memoryPatch.updates.timeline.add_event.event, /她没有回头/);
    assert.doesNotMatch(memoryPatch.updates.timeline.add_event.event, /作者提交了/);

    const reviewPath = path.join(root, "projects/black_tower/01_intake", packet.input_id, "chapter_quality_review.md");
    const review = await fs.readFile(reviewPath, "utf8");
    assert.match(review, /review_type: chapter_quality_review/);
    assert.match(review, /overall_score:\s*[0-9.]+/);
    assert.match(review, /decision:\s*(pass|minor_revision|major_revision|rewrite)/);
    assert.match(review, /## Scorecard/);
    assert.match(review, /主角锚定/);
    assert.doesNotMatch(review, /chapter_end_hook: weak_or_missing/);

    const result = await validateProject("black_tower");
    assert.equal(result.ok, true, result.errors.join("\n"));
  });
});

test("creative input loop routes, reviews, applies and exposes GUI status", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const packet = await ingestChapter(root);

    const route = await routeInput("black_tower", packet.input_id);
    assert.equal(route.route_plan.primary_route, "human_chapter_intake");
    assert.deepEqual(route.route_plan.next_commands, [`novel intake chapter black_tower ${packet.input_id}`]);

    await createChapterIntake("black_tower", packet.input_id);
    const queue = await listReviewQueue("black_tower");
    assert.equal(queue.length, 1);
    assert.equal(queue[0].input_id, packet.input_id);

    const decision = await decideReview("black_tower", packet.input_id, "approve", "accept plot memory");
    assert.equal(decision.decision.decision, "approved");
    assert.equal((await listReviewQueue("black_tower")).length, 0);
    assert.equal((await listPendingApply("black_tower")).length, 1);

    const applied = await applyMemoryPatch("black_tower", packet.input_id, "plot");
    assert.equal(applied.target, "plot");
    assert.match(applied.patch_id, new RegExp(packet.input_id));
    assert(applied.changed_files.includes("30_plot/timeline.jsonl"));

    const timeline = await fs.readFile(path.join(root, "projects/black_tower/30_plot/timeline.jsonl"), "utf8");
    assert.match(timeline, /source_patch/);

    const status = await getProjectStatus("black_tower");
    assert.equal(status.counts.by_status.applied, 1);
    assert.equal(status.review_queue.length, 0);
    assert.equal(status.pending_apply.length, 0);
    assert.equal(status.validation.ok, true, status.validation.errors.join("\n"));

    const trace = await readTraceTail("black_tower", 20);
    assert(trace.some((event) => event.command === "route"));
    assert(trace.some((event) => event.command === "review.decide"));
    assert(trace.some((event) => event.command === "patch.apply"));
  });
});

test("unsafe file-system ids are rejected", { concurrency: false }, async () => {
  await withTempCwd(async () => {
    await assert.rejects(() => initProject("../escaped_project"), /safe file-system id/);
    await initProject("black_tower");
    await assert.rejects(() => buildContextPacket("black_tower", "../escaped_context"), /safe file-system id/);
    await assert.rejects(() => hardenVolume("black_tower", "../../escaped_harden"), /safe file-system id/);
  });
});

test("discarded idea ingest feeds ghost scan candidates", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const filePath = path.join(root, "discarded.md");
    await fs.writeFile(filePath, "#black_tower #废案\n废掉的桥段：同类主题再次出现时，旧反派以假身份回归。\n", "utf8");
    const packet = await ingestInput("black_tower", filePath);

    const discarded = await fs.readFile(path.join(root, "projects/black_tower/40_style/discarded_brilliance.md"), "utf8");
    assert.match(discarded, new RegExp(packet.input_id));
    assert.match(discarded, /resurrection_triggers/);

    await fs.appendFile(path.join(root, "projects/black_tower/10_bible/open_questions.md"), "\n- 同类主题再次出现\n", "utf8");
    const reportPath = await ghostScan("black_tower");
    const report = await fs.readFile(reportPath, "utf8");
    assert.match(report, new RegExp(packet.input_id));
  });
});

async function withProject(run: (root: string) => Promise<void>): Promise<void> {
  await withTempCwd(async (root) => {
    await initProject("black_tower");
    await run(root);
  });
}

async function withTempCwd(run: (root: string) => Promise<void>): Promise<void> {
  const previous = process.cwd();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "novel-driver-os-test-"));
  process.chdir(root);
  try {
    await run(root);
  } finally {
    process.chdir(previous);
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function ingestChapter(root: string): Promise<Awaited<ReturnType<typeof ingestInput>>> {
  const filePath = path.join(root, "chapter.md");
  await fs.writeFile(filePath, "#black_tower #正文 #ch50 #正稿\n她没有回头，只是把伞往他那边偏了半寸。\n\n“你最好别死。”\n", "utf8");
  return ingestInput("black_tower", filePath);
}
