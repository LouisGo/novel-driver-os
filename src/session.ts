import path from "node:path";
import { readYaml, writeYaml } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { getProjectStatus } from "./status.js";
import { appendTrace } from "./trace.js";
import { nowIso } from "./time.js";

export interface SessionLedger {
  state: "active" | "paused";
  paused_at: string | null;
  resumed_at: string | null;
  note: string | null;
  updated_at: string;
}

export async function getSessionStatus(projectName: string): Promise<{ ok: true; session: SessionLedger; project_status: Awaited<ReturnType<typeof getProjectStatus>> }> {
  return {
    ok: true,
    session: await readSession(projectName),
    project_status: await getProjectStatus(projectName),
  };
}

export async function pauseSession(projectName: string, note: string | null): Promise<{ ok: true; session: SessionLedger; changed_files: string[] }> {
  const session: SessionLedger = {
    ...(await readSession(projectName)),
    state: "paused",
    paused_at: nowIso(),
    note,
    updated_at: nowIso(),
  };
  await writeSession(projectName, session);
  await appendTrace(projectName, {
    command: "session.pause",
    artifacts: ["session.yaml"],
    metadata: { note },
  });
  return { ok: true, session, changed_files: ["session.yaml"] };
}

export async function resumeSession(projectName: string, note: string | null): Promise<{ ok: true; session: SessionLedger; changed_files: string[] }> {
  const session: SessionLedger = {
    ...(await readSession(projectName)),
    state: "active",
    resumed_at: nowIso(),
    note,
    updated_at: nowIso(),
  };
  await writeSession(projectName, session);
  await appendTrace(projectName, {
    command: "session.resume",
    artifacts: ["session.yaml"],
    metadata: { note },
  });
  return { ok: true, session, changed_files: ["session.yaml"] };
}

async function readSession(projectName: string): Promise<SessionLedger> {
  try {
    const parsed = await readYaml<Partial<SessionLedger>>(sessionPath(projectName));
    return {
      state: parsed.state === "paused" ? "paused" : "active",
      paused_at: parsed.paused_at ?? null,
      resumed_at: parsed.resumed_at ?? null,
      note: parsed.note ?? null,
      updated_at: parsed.updated_at ?? nowIso(),
    };
  } catch {
    return {
      state: "active",
      paused_at: null,
      resumed_at: null,
      note: null,
      updated_at: nowIso(),
    };
  }
}

async function writeSession(projectName: string, session: SessionLedger): Promise<void> {
  await writeYaml(sessionPath(projectName), session);
}

function sessionPath(projectName: string): string {
  return path.join(projectRoot(projectName), "session.yaml");
}
