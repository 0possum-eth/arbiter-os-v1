import {
  computeExecutionDigest,
  EXECUTION_DIGEST_PATTERN,
  MAX_EXECUTION_OUTPUT_SUMMARY_CHARS,
  type TaskCompletionPacket,
  type VerificationPacket
} from "../contracts/packets";
import type { TaskPacket } from "../execute/taskPacket";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isMeaningfulExecutionRecord = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  const outputSummary = typeof record.outputSummary === "string" ? record.outputSummary : "";
  const outputDigest = typeof record.outputDigest === "string" ? record.outputDigest : "";
  return (
    isNonEmptyString(record.command) &&
    Number.isInteger(record.exitCode) &&
    (record.exitCode as number) === 0 &&
    isNonEmptyString(outputSummary) &&
    outputSummary.trim().length <= MAX_EXECUTION_OUTPUT_SUMMARY_CHARS &&
    EXECUTION_DIGEST_PATTERN.test(outputDigest) &&
    outputDigest === computeExecutionDigest(outputSummary)
  );
};

const isPathEvidence = (value: string) => /[\\/]/.test(value) && /\.[A-Za-z0-9]+$/.test(value);

const isMeaningfulTestEvidence = (value: string) =>
  value.startsWith("executed:") || value.endsWith(".test.ts") || value.endsWith(".spec.ts");

const hasMeaningfulEvidence = (completionPacket: TaskCompletionPacket) => {
  if (!Array.isArray(completionPacket.execution) || completionPacket.execution.length === 0) {
    return false;
  }
  const execution = completionPacket.execution.filter((item) => isMeaningfulExecutionRecord(item));
  if (execution.length !== completionPacket.execution.length) {
    return false;
  }
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
  return execution.length > 0;
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
