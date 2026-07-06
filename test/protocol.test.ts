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
import { createMemoryProposal } from "../src/propose.js";
import { acceptChapter } from "../src/chapter.js";
import { exportChapters } from "../src/exporter.js";
import { compareVariants, decideVariant, registerVariant } from "../src/variant.js";
import { createSnapshot, restoreSnapshot } from "../src/snapshot.js";
import { getSessionStatus, pauseSession, resumeSession } from "../src/session.js";
import { setBookProfile } from "../src/book.js";
import { createStorycraftArtifact, listStorycraftArtifacts, readStorycraftArtifact } from "../src/storycraft.js";

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
    assert.equal(decision.changed_files.includes(`00_inbox/processed/${packet.input_id}.yaml`), true);
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
    assert(trace.some((event) => event.command === "snapshot.create"));
    assert(trace.some((event) => event.command === "patch.apply"));
  });
});

test("multi-intent input, outline route and non-chapter proposal enter review loop", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const styleFeedbackPath = path.join(root, "style-feedback.md");
    await fs.writeFile(styleFeedbackPath, "#black_tower #文风 #反馈 #大纲\n文风要克制，同时第一卷大纲不要设定集开篇。\n", "utf8");
    const stylePacket = await ingestInput("black_tower", styleFeedbackPath);
    assert.equal(stylePacket.detected_type, "style_feedback");
    assert(stylePacket.detected_intents.includes("style_feedback"));
    assert(stylePacket.detected_intents.includes("outline"));
    assert(stylePacket.detected_intents.includes("feedback"));

    const outlinePath = path.join(root, "outline.md");
    await fs.writeFile(outlinePath, "#black_tower #大纲 #候选\n第一卷：主角查清旧案，进入学馆，卷尾发现父亲留下反证。\n", "utf8");
    const outlinePacket = await ingestInput("black_tower", outlinePath);
    const route = await routeInput("black_tower", outlinePacket.input_id);
    assert.equal(route.route_plan.primary_route, "emotion_curve");
    assert.deepEqual(route.route_plan.blocked_by, []);
    assert(route.route_plan.responsible_roles.includes("Emotion Curator"));
    assert(route.route_plan.responsible_roles.includes("Canon Checker"));
    assert(route.route_plan.next_commands.includes(`agent: use novel-emotion-curve for black_tower ${outlinePacket.input_id}`));
    assert(route.route_plan.next_commands.includes(`novel propose black_tower ${outlinePacket.input_id} --kind outline`));

    const proposal = await createMemoryProposal("black_tower", outlinePacket.input_id, "outline");
    assert.equal(proposal.kind, "outline");
    assert.equal((await listReviewQueue("black_tower")).some((item) => item.input_id === outlinePacket.input_id), true);

    const decision = await decideReview("black_tower", outlinePacket.input_id, "approve", "accept outline proposal");
    assert.equal(decision.decision.decision, "approved");
    const packetAfterApprove = YAML.parse(await fs.readFile(path.join(root, `projects/black_tower/00_inbox/processed/${outlinePacket.input_id}.yaml`), "utf8"));
    assert.equal(packetAfterApprove.status, "approved_pending_apply");
    assert.equal((await listPendingApply("black_tower")).some((item) => item.input_id === outlinePacket.input_id), true);

    const applied = await applyMemoryPatch("black_tower", outlinePacket.input_id, "plot");
    assert.equal(applied.target, "plot");
    const result = await validateProject("black_tower");
    assert.equal(result.ok, true, result.errors.join("\n"));
  });
});

test("chapter accept writes sorted index and export copies accepted hot chapters", { concurrency: false }, async () => {
  await withProject(async (root) => {
    await setBookProfile("black_tower", {
      title: "黑塔",
      synopsis: "一部关于雨夜与黑塔的长篇小说。",
      genre: "玄幻",
      tags: ["测试"],
    });
    const first = await ingestChapter(root, "ch1.md", "#black_tower #正文 #ch1 #正稿\n# 第一章\n她没有回头，只是把伞往他那边偏了半寸。\n\n“你最好别死。”\n");
    await createChapterIntake("black_tower", first.input_id);
    await decideReview("black_tower", first.input_id, "approve", "accept chapter");
    const accepted = await acceptChapter("black_tower", first.input_id, "ch0001", "hot");
    assert.deepEqual(accepted.changed_files, ["50_chapters/hot/ch0001.txt", "50_chapters/chapter_index.yaml"]);

    const manuscript = await fs.readFile(path.join(root, "projects/black_tower/50_chapters/hot/ch0001.txt"), "utf8");
    assert.doesNotMatch(manuscript, /#black_tower/);
    assert.match(manuscript, /# 第一章/);

    const outDir = path.join(root, "exported");
    const exported = await exportChapters("black_tower", { format: "txt", out: outDir });
    assert.equal(exported.exported_files.length, 1);
    assert.match(await fs.readFile(path.join(outDir, "0001.第一章.txt"), "utf8"), /你最好别死/);

    const defaultExport = await exportChapters("black_tower", { format: "txt" });
    assert(defaultExport.exported_files.some((file) => file.endsWith("exports/黑塔_txt/0001.第一章.txt")));
    assert.equal(defaultExport.zip_file?.endsWith("exports/黑塔.zip"), true);

    const result = await validateProject("black_tower");
    assert.equal(result.ok, true, result.errors.join("\n"));
  });
});

test("variant workflow compares, decides winner and accepts the winning draft", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const packet = await ingestChapter(root);
    await createChapterIntake("black_tower", packet.input_id);
    await decideReview("black_tower", packet.input_id, "approve", "compare variants");

    const draftA = path.join(root, "variant-a.txt");
    const draftB = path.join(root, "variant-b.txt");
    await fs.writeFile(draftA, "她没有回头。\n\n这一版很短。\n", "utf8");
    await fs.writeFile(draftB, "她没有回头，只是把伞往他那边偏了半寸。\n血从掌心落下，他必须选择是否救人。\n门外有人问：你最好别死？\n", "utf8");

    const variantA = await registerVariant("black_tower", packet.input_id, draftA, "short", "ch0050");
    const variantB = await registerVariant("black_tower", packet.input_id, draftB, "pressure", "ch0050");
    const compared = await compareVariants("black_tower", packet.input_id);
    assert.equal(compared.changed_files.length, 1);
    assert.match(compared.report, /章节目标贴合度/);

    const decided = await decideVariant("black_tower", packet.input_id, variantB.variant.variant_id, "pressure wins");
    assert.equal(decided.winner_variant_id, variantB.variant.variant_id);
    const accepted = await acceptChapter("black_tower", packet.input_id, "ch0050", "hot", variantB.variant.variant_id);
    assert.equal(accepted.chapter, "ch0050");

    const manifest = YAML.parse(await fs.readFile(path.join(root, `projects/black_tower/50_chapters/variants/${packet.input_id}/variants.yaml`), "utf8"));
    assert.equal(manifest.winner_variant_id, variantB.variant.variant_id);
    assert.equal(manifest.variants.find((item: { variant_id: string }) => item.variant_id === variantA.variant.variant_id).status, "rejected");

    const result = await validateProject("black_tower");
    assert.equal(result.ok, true, result.errors.join("\n"));
  });
});

test("session ledger and snapshots can pause, resume and restore project memory", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const paused = await pauseSession("black_tower", "author takes over");
    assert.equal(paused.session.state, "paused");
    assert.equal((await getSessionStatus("black_tower")).session.state, "paused");
    const resumed = await resumeSession("black_tower", "agent resumes");
    assert.equal(resumed.session.state, "active");

    const snapshot = await createSnapshot("black_tower", "before canon mutation");
    const canonPath = path.join(root, "projects/black_tower/10_bible/canon_registry.md");
    await fs.appendFile(canonPath, "\nMUTATED CANON\n", "utf8");
    assert.match(await fs.readFile(canonPath, "utf8"), /MUTATED CANON/);

    const restored = await restoreSnapshot("black_tower", snapshot.snapshot_id);
    assert(restored.restored_scopes.includes("10_bible"));
    assert.doesNotMatch(await fs.readFile(canonPath, "utf8"), /MUTATED CANON/);

    const trace = await readTraceTail("black_tower", 20);
    assert(trace.some((event) => event.command === "session.pause"));
    assert(trace.some((event) => event.command === "snapshot.restore"));
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

test("learning sample routes to exemplar learning without entering canon", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const filePath = path.join(root, "sample.md");
    await fs.writeFile(filePath, "#black_tower #样本 #学习\n这是一段我觉得写得好的网文开头样本，想投喂系统学习它的节奏、钩子和人味细节。\n", "utf8");
    const packet = await ingestInput("black_tower", filePath);
    assert.equal(packet.detected_type, "learning_sample");
    assert(packet.detected_intents.includes("learning_sample"));
    assert(packet.system_interpretation.some((item) => item.includes("不能进入正史")));

    const route = await routeInput("black_tower", packet.input_id);
    assert.equal(route.route_plan.primary_route, "exemplar_learning");
    assert(route.route_plan.secondary_routes.includes("learning_transfer"));
    assert(route.route_plan.responsible_roles.includes("Style Curator"));
    assert(route.route_plan.blocked_by.includes("agent_skill_required_novel_exemplar_learning"));
    assert(route.route_plan.next_commands.includes(`agent: use novel-exemplar-learning for black_tower ${packet.input_id}`));
  });
});

test("storycraft artifacts are registered, listed, validated and exposed to GUI status/context", { concurrency: false }, async () => {
  await withProject(async (root) => {
    const inspirationPath = path.join(root, "idea.md");
    await fs.writeFile(inspirationPath, "#black_tower #灵感\n一个被城市记忆排斥的人，靠修复别人的遗憾升级。\n", "utf8");
    const packet = await ingestInput("black_tower", inspirationPath);
    const route = await routeInput("black_tower", packet.input_id);
    assert.equal(route.route_plan.primary_route, "premise_alchemy");
    assert(route.route_plan.blocked_by.includes("agent_skill_required_novel_premise_alchemy"));
    assert(route.route_plan.next_commands.some((command) => command.includes("storycraft premise create")));

    const reportPath = path.join(root, "premise-report.md");
    await fs.writeFile(reportPath, [
      "# Premise Alchemy Report",
      "",
      "one_sentence_hook: 被城市记忆排斥的少年，通过修复他人的遗憾夺回自己的存在。",
      "freshness_hook: 升级流 + 城市记忆 + 情绪债务。",
      "human_need: 被抹去的人重新被看见。",
    ].join("\n"), "utf8");

    const created = await createStorycraftArtifact("black_tower", "premise", {
      fromFile: reportPath,
      sourceInput: packet.input_id,
      label: "记忆排斥卖点",
      summary: "升级流与城市记忆碰撞的一句话卖点。",
      sourceActor: "agent",
    });
    assert.equal(created.artifact.kind, "premise");
    assert.equal(created.artifact.source_input_id, packet.input_id);
    assert(created.changed_files.includes(created.artifact.content_file));

    const listed = await listStorycraftArtifacts("black_tower", "premise");
    assert.equal(listed.length, 1);
    assert.equal(listed[0].artifact_id, created.artifact.artifact_id);

    const shown = await readStorycraftArtifact("black_tower", "premise", created.artifact.artifact_id);
    assert.match(shown.content, /城市记忆/);

    const status = await getProjectStatus("black_tower");
    assert.equal(status.storycraft_artifacts.length, 1);
    assert.equal(status.storycraft_artifacts[0].artifact_id, created.artifact.artifact_id);

    const context = await fs.readFile(await buildContextPacket("black_tower", "ch0001"), "utf8");
    assert.match(context, /Storycraft Artifacts/);
    assert.match(context, /城市记忆/);

    const trace = await readTraceTail("black_tower", 20);
    assert(trace.some((event) => event.command === "storycraft.premise.create"));

    const sourceOnly = await createStorycraftArtifact("black_tower", "payoff", {
      sourceInput: packet.input_id,
      label: "source-only payoff seed",
    });
    assert.equal(sourceOnly.artifact.kind, "payoff");
    assert.match((await readStorycraftArtifact("black_tower", "payoff", sourceOnly.artifact.artifact_id)).content, /Source Input/);

    const result = await validateProject("black_tower");
    assert.equal(result.ok, true, result.errors.join("\n"));
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

async function ingestChapter(root: string, fileName = "chapter.md", text = "#black_tower #正文 #ch50 #正稿\n她没有回头，只是把伞往他那边偏了半寸。\n\n“你最好别死。”\n"): Promise<Awaited<ReturnType<typeof ingestInput>>> {
  const filePath = path.join(root, fileName);
  await fs.writeFile(filePath, text, "utf8");
  return ingestInput("black_tower", filePath);
}
