import type { VerificationPacket } from "../contracts/packets";
import type { TaskCompletionPacket } from "../contracts/packets";
import type { TaskPacket } from "../execute/taskPacket";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPathEvidence = (value: string) => /[\\/]/.test(value) && /\.[A-Za-z0-9]+$/.test(value);

const isMeaningfulTestEvidence = (value: string) =>
  value.startsWith("executed:") || value.endsWith(".test.ts") || value.endsWith(".spec.ts");

const hasMeaningfulEvidence = (completionPacket: TaskCompletionPacket) => {
  const hasTestsField = Array.isArray(completionPacket.tests);
  const tests = hasTestsField
    ? completionPacket.tests.filter(
        (item): item is string => isNonEmptyString(item) && isMeaningfulTestEvidence(item.trim())
      )
    : [];
  const hasFilesChangedField = Array.isArray(completionPacket.files_changed);
  const filesChanged = hasFilesChangedField
    ? completionPacket.files_changed.filter(
        (item): item is string => isNonEmptyString(item) && isPathEvidence(item.trim())
      )
    : [];
  if (hasTestsField && tests.length === 0) {
    return false;
  }
  if (hasFilesChangedField && filesChanged.length === 0) {
    return false;
  }
  return tests.length > 0 || filesChanged.length > 0;
};

export async function verifySpec(
  packet: TaskPacket,
  completionPacket: TaskCompletionPacket
): Promise<VerificationPacket> {
  return {
    taskId: packet.taskId,
    passed: completionPacket.taskId === packet.taskId && hasMeaningfulEvidence(completionPacket)
  };
}
