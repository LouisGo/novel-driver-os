import path from "node:path";
import { ensureDir, pathExists, writeText, writeYaml } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { nowIso } from "./time.js";

const PROJECT_DIRS = [
  "00_inbox/raw",
  "00_inbox/triaged",
  "00_inbox/processed",
  "00_inbox/ignored",
  "01_intake",
  "10_bible",
  "20_entities/characters",
  "20_entities/factions",
  "20_entities/locations",
  "20_entities/items",
  "30_plot",
  "40_style",
  "50_chapters/hot",
  "50_chapters/warm",
  "50_chapters/cold",
  "60_alignment/weekly_reports",
  "70_debt",
  "80_context",
  "90_archive",
];

const OPTIONAL_PROJECT_DIRS = [
  "00_inbox/routes",
  "00_inbox/reviews",
];

export const REQUIRED_PROJECT_DIRS = PROJECT_DIRS;

export const REQUIRED_PROJECT_FILES = [
  "project.yaml",
  "10_bible/canon_registry.md",
  "10_bible/world_contract.md",
  "10_bible/intentional_ambiguity.md",
  "10_bible/open_questions.md",
  "20_entities/characters/protagonist.yaml",
  "20_entities/characters/heroine.yaml",
  "20_entities/relationship_graph.md",
  "30_plot/timeline.jsonl",
  "30_plot/event_ledger.jsonl",
  "30_plot/foreshadowing.md",
  "30_plot/unresolved_hooks.md",
  "40_style/style_bible.md",
  "40_style/aspirational_style.md",
  "40_style/anti_style.md",
  "40_style/discarded_brilliance.md",
  "40_style/style_entropy_budget.md",
  "70_debt/retcon_debt.yaml",
];

export async function initProject(projectName: string): Promise<string> {
  const root = projectRoot(projectName);
  if (await pathExists(root)) {
    throw new Error(`Project already exists: ${root}`);
  }

  for (const dir of [...PROJECT_DIRS, ...OPTIONAL_PROJECT_DIRS]) {
    await ensureDir(path.join(root, dir));
  }

  await writeYaml(path.join(root, "project.yaml"), {
    name: projectName,
    schema_version: "novel-driver-os/v0.1",
    created_at: nowIso(),
    mode: "manual_first",
    canon_policy: {
      ai_may_modify_canon_directly: false,
      ai_outputs_are: ["candidate", "proposal", "patch", "report", "hypothesis"],
    },
    input_policy: {
      default_authority: "L1_candidate",
      raw_input_is_canon: false,
      confirmation_required_for_canon: true,
    },
  });

  await writeText(path.join(root, "10_bible/canon_registry.md"), `# Canon Registry

AI 不能直接修改本文件。所有正史变更必须先进入 memory_patch.yaml 或其他 proposal。

## Confirmed Canon

_No confirmed canon yet._
`);

  await writeText(path.join(root, "10_bible/world_contract.md"), `# World Contract

记录世界运行规则、能力边界、代价和不可违反的约束。

## Constraints

_Pending author confirmation._
`);

  await writeText(path.join(root, "10_bible/intentional_ambiguity.md"), `# Intentional Ambiguity

记录作者明确要求暂不解释、暂不入正史、或保留多义性的内容。

## Active Ambiguities

_None yet._
`);

  await writeText(path.join(root, "10_bible/open_questions.md"), `# Open Questions

系统不确定、需要作者定调的问题。未确认意图和弱猜测应优先进入这里，而不是进入正史。

## Questions

_None yet._
`);

  await writeYaml(path.join(root, "20_entities/characters/protagonist.yaml"), {
    id: "protagonist",
    display_name: "主角",
    authority: "template",
    confirmed_traits: [],
    candidate_traits: [],
    open_questions: [],
  });

  await writeYaml(path.join(root, "20_entities/characters/heroine.yaml"), {
    id: "heroine",
    display_name: "女主",
    authority: "template",
    confirmed_traits: [],
    candidate_traits: [],
    open_questions: [],
  });

  await writeText(path.join(root, "20_entities/relationship_graph.md"), `# Relationship Graph

用 Markdown 记录人物关系候选和已确认关系。MVP 不自动写入正史关系。
`);

  await writeText(path.join(root, "30_plot/timeline.jsonl"), "");
  await writeText(path.join(root, "30_plot/event_ledger.jsonl"), "");
  await writeText(path.join(root, "30_plot/foreshadowing.md"), `# Foreshadowing

## Confirmed

_None yet._

## Candidates

_None yet._
`);
  await writeText(path.join(root, "30_plot/unresolved_hooks.md"), `# Unresolved Hooks

_No unresolved hooks yet._
`);

  await writeText(path.join(root, "40_style/style_bible.md"), `# Style Bible

只记录作者稳定确认过的长期文风规则。AI 不得直接写入本文件。

## Confirmed Rules

_None yet._
`);

  await writeText(path.join(root, "40_style/aspirational_style.md"), `# Aspirational Style

记录作者想靠近的方向，不等同于模仿某个作品或当前草稿。

\`\`\`yaml
aspirational_style: {}
\`\`\`
`);

  await writeText(path.join(root, "40_style/anti_style.md"), `# Anti Style

记录作者明确不想要的表达、桥段、节奏和 AI 味。

## Rules

_None yet._
`);

  await writeText(path.join(root, "40_style/discarded_brilliance.md"), `# Discarded Brilliance

被舍弃但可能在未来复活的灵感。每条废案必须包含 resurrection_triggers。

\`\`\`yaml
discarded_items: []
\`\`\`
`);

  await writeText(path.join(root, "40_style/style_entropy_budget.md"), `# Style Entropy Budget

\`\`\`yaml
style_entropy_budget:
  per_10_chapters:
    allow_experimental_drafts: 2
    allow_voice_deviation: medium
    force_non_default_variant: true
exploration_axes:
  - 更冷的叙事
  - 更密的信息遮蔽
  - 更强的感官细节
  - 更少解释的关系推进
\`\`\`
`);

  await writeYaml(path.join(root, "70_debt/retcon_debt.yaml"), {
    current_arc_total: 0,
    last_10_chapters: 0,
    threshold: 3,
    entries: [],
  });
  await writeText(path.join(root, "trace.jsonl"), "");

  await writeText(path.join(root, "README.md"), `# ${projectName}

This is a Novel Driver OS project.

- \`00_inbox/\`: raw author input and triaged Author Input Packets.
- \`01_intake/\`: Creative Intake Capsules generated from human chapters or fragments.
- \`10_bible/\`: long-term canon-facing memory. AI writes proposals, not canon.
- \`20_entities/\`: character, faction, location and item state.
- \`30_plot/\`: timeline, event ledger, foreshadowing and unresolved hooks.
- \`40_style/\`: confirmed style, aspirational style, anti-style and discarded brilliance.
- \`50_chapters/\`: hot, warm and cold chapter layers.
- \`60_alignment/\`: weekly author alignment reports.
- \`70_debt/\`: retcon debt ledger.
- \`80_context/\`: context packets assembled for future work.
- \`90_archive/\`: hardening outputs and future deep archive packages.
`);

  return root;
}
