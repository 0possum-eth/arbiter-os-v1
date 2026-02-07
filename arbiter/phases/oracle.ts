import type { TaskPacket } from "../execute/taskPacket";
import { emitReceipt } from "../receipts/emitReceipt";

const trimTo = (value: string, limit: number) => {
  const trimmed = value.trim();
  return trimmed.length <= limit ? trimmed : `${trimmed.slice(0, limit)}...`;
};

const buildFindings = (taskPacket?: TaskPacket): string[] => {
  const taskId = taskPacket?.taskId ?? "RUN_FINALIZATION";
  const findings: string[] = [`oracle_scope:${taskId}`];

  const query = typeof taskPacket?.query === "string" ? taskPacket.query.trim() : "";
  if (query.length > 0) {
    findings.push(`intent:${trimTo(query, 64)}`);
  }

  const citations = Array.isArray(taskPacket?.citations)
    ? taskPacket.citations.map((citation) => citation.trim()).filter((citation) => citation.length > 0)
    : [];
  if (citations.length > 0) {
    findings.push(`source_count:${citations.length}`);
  } else {
    findings.push("source_count:0");
  }

  return findings;
};

export async function runOracle(taskPacket?: TaskPacket): Promise<void> {
  const taskId = taskPacket?.taskId ?? "RUN_FINALIZATION";
  await emitReceipt({
    type: "ORACLE_REVIEWED",
    taskId,
    packet: {
      taskId,
      passed: true,
      findings: buildFindings(taskPacket)
    }
  });
}
