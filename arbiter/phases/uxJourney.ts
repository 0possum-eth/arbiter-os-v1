import type { TaskPacket } from "../execute/taskPacket";

const trimTo = (value: string, limit: number) => {
  const trimmed = value.trim();
  return trimmed.length <= limit ? trimmed : `${trimmed.slice(0, limit)}...`;
};

const normalizeChecks = (checks: string[]) => {
  const deduped: string[] = [];
  for (const check of checks) {
    const normalized = check.trim();
    if (normalized.length === 0) {
      continue;
    }
    if (!deduped.includes(normalized)) {
      deduped.push(normalized);
    }
  }
  return deduped;
};

export const buildUxJourney = (taskPacket?: TaskPacket): string[] => {
  const taskId = taskPacket?.taskId ?? "RUN_FINALIZATION";
  const checks: string[] = [
    `entrypoint:${taskId}`,
    taskPacket?.contextPack?.includes("## Context Pack") ? "context_pack:present" : "context_pack:missing"
  ];

  const query = typeof taskPacket?.query === "string" ? taskPacket.query.trim() : "";
  if (query.length > 0) {
    checks.push(`intent:${trimTo(query, 64)}`);
  }

  const citations = Array.isArray(taskPacket?.citations)
    ? taskPacket.citations.map((citation) => citation.trim()).filter((citation) => citation.length > 0)
    : [];
  if (citations.length > 0) {
    checks.push(...citations.slice(0, 3).map((citation) => `citation:${trimTo(citation, 80)}`));
  } else {
    checks.push("citation:none");
  }

  const normalized = normalizeChecks(checks);
  return normalized.length > 0 ? normalized : ["entrypoint:RUN_FINALIZATION"];
};
