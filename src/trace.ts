import { randomUUID } from "node:crypto";
import path from "node:path";
import { appendText, listFilesRecursive, pathExists, readText } from "./fs-utils.js";
import { projectRoot } from "./paths.js";
import { compactTimestamp, nowIso } from "./time.js";

export interface TraceEventInput {
  command: string;
  input_id?: string;
  from_status?: string;
  to_status?: string;
  artifacts?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface TraceEvent {
  event_id: string;
  created_at: string;
  project: string;
  command: string;
  input_id?: string;
  from_status?: string;
  to_status?: string;
  artifacts: string[];
  warnings: string[];
  metadata: Record<string, unknown>;
}

export async function appendTrace(projectName: string, input: TraceEventInput): Promise<TraceEvent> {
  const event: TraceEvent = {
    event_id: `trace_${compactTimestamp()}_${randomUUID().slice(0, 8)}`,
    created_at: nowIso(),
    project: projectName,
    command: input.command,
    input_id: input.input_id,
    from_status: input.from_status,
    to_status: input.to_status,
    artifacts: input.artifacts ?? [],
    warnings: input.warnings ?? [],
    metadata: input.metadata ?? {},
  };
  await appendText(tracePath(projectName), JSON.stringify(event));
  return event;
}

export async function readTraceTail(projectName: string, limit = 20): Promise<TraceEvent[]> {
  const filePath = tracePath(projectName);
  if (!(await pathExists(filePath))) return [];
  const lines = (await readText(filePath)).split(/\r?\n/).filter(Boolean).slice(-limit);
  const events: TraceEvent[] = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as TraceEvent);
    } catch {
      // Validation can report malformed trace lines later; status skips them.
    }
  }
  return events;
}

export async function listContextPackets(projectName: string): Promise<string[]> {
  const root = projectRoot(projectName);
  const dir = path.join(root, "80_context");
  return (await listFilesRecursive(dir))
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.relative(root, file).replaceAll(path.sep, "/"))
    .sort();
}

function tracePath(projectName: string): string {
  return path.join(projectRoot(projectName), "trace.jsonl");
}
