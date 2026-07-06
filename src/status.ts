import { listInputs } from "./input.js";
import { listPendingApply, listReviewQueue } from "./review.js";
import { listStorycraftArtifacts } from "./storycraft.js";
import { listContextPackets, readTraceTail } from "./trace.js";
import { validateProject } from "./validate.js";

export interface ProjectStatus {
  project: string;
  counts: {
    by_status: Record<string, number>;
    by_type: Record<string, number>;
  };
  review_queue: Awaited<ReturnType<typeof listReviewQueue>>;
  pending_apply: Awaited<ReturnType<typeof listPendingApply>>;
  context_packets: string[];
  storycraft_artifacts: Awaited<ReturnType<typeof listStorycraftArtifacts>>;
  latest_trace: Awaited<ReturnType<typeof readTraceTail>>;
  validation: Awaited<ReturnType<typeof validateProject>>;
}

export async function getProjectStatus(projectName: string): Promise<ProjectStatus> {
  const packets = await listInputs(projectName);
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const packet of packets) {
    byStatus[packet.status] = (byStatus[packet.status] ?? 0) + 1;
    byType[packet.detected_type] = (byType[packet.detected_type] ?? 0) + 1;
  }

  return {
    project: projectName,
    counts: {
      by_status: byStatus,
      by_type: byType,
    },
    review_queue: await listReviewQueue(projectName),
    pending_apply: await listPendingApply(projectName),
    context_packets: await listContextPackets(projectName),
    storycraft_artifacts: await listStorycraftArtifacts(projectName),
    latest_trace: await readTraceTail(projectName, 10),
    validation: await validateProject(projectName),
  };
}
