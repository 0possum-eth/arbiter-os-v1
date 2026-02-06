import type { VerificationPacket } from "../contracts/packets";
import type { TaskCompletionPacket } from "../contracts/packets";
import type { TaskPacket } from "../execute/taskPacket";

export async function verifyQuality(
  packet: TaskPacket,
  completionPacket: TaskCompletionPacket
): Promise<VerificationPacket> {
  const tests = Array.isArray(completionPacket.tests)
    ? completionPacket.tests.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const filesChanged = Array.isArray(completionPacket.files_changed)
    ? completionPacket.files_changed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];
  const hasEvidence = tests.length > 0 || filesChanged.length > 0;

  return {
    taskId: packet.taskId,
    passed: completionPacket.taskId === packet.taskId && hasEvidence
  };
}
