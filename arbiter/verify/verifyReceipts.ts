import {
  computeExecutionDigest,
  EXECUTION_DIGEST_PATTERN,
  MAX_EXECUTION_OUTPUT_SUMMARY_CHARS,
  type ExecutionRecord,
  type IntegrationPacket,
  type TaskCompletionPacket,
  type UxPacket,
  type VerificationPacket
} from "../contracts/packets";

type Receipt = {
  type: string;
  taskId?: string;
  passed?: boolean;
  packet?: unknown;
};
type ReceiptEnvelope = { id?: string; receiptId?: string; ts?: string; receipt: Receipt };

export type ReceiptEvidence = {
  executor_receipt_id: string;
  verifier_receipt_ids: string[];
  integration_receipt_id?: string;
  ux_receipt_id?: string;
  execution: ExecutionRecord[];
  tests?: string[];
  files_changed?: string[];
};

type VerifyReceiptOptions = {
  requiresIntegrationCheck?: boolean;
  uxSensitive?: boolean;
};

type NormalizedEvidence = {
  execution: ExecutionRecord[];
  tests: string[];
  files_changed: string[];
};

const getReceiptId = (envelope: ReceiptEnvelope, index: number) =>
  envelope.id ?? envelope.receiptId ?? envelope.ts ?? `receipt-${index + 1}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isExecutionRecord = (value: unknown): value is ExecutionRecord => {
  if (!isRecord(value)) {
    return false;
  }
  const outputSummary = typeof value.outputSummary === "string" ? value.outputSummary : "";
  const outputDigest = typeof value.outputDigest === "string" ? value.outputDigest : "";
  return (
    typeof value.command === "string" &&
    value.command.trim().length > 0 &&
    Number.isInteger(value.exitCode) &&
    value.exitCode === 0 &&
    outputSummary.trim().length > 0 &&
    outputSummary.trim().length <= MAX_EXECUTION_OUTPUT_SUMMARY_CHARS &&
    EXECUTION_DIGEST_PATTERN.test(outputDigest) &&
    outputDigest === computeExecutionDigest(outputSummary)
  );
};

const isExecutionList = (value: unknown): value is ExecutionRecord[] =>
  Array.isArray(value) && value.every((item) => isExecutionRecord(item));

const hasOnlyKeys = (value: Record<string, unknown>, allowedKeys: string[]) =>
  Object.keys(value).every((key) => allowedKeys.includes(key));

const isPathEvidence = (value: string) => /[\\/]/.test(value) && /\.[A-Za-z0-9]+$/.test(value);

const isMeaningfulTestEvidence = (value: string) =>
  value.startsWith("executed:") || value.endsWith(".test.ts") || value.endsWith(".spec.ts");

const hasMeaningfulEvidence = (completionPacket: TaskCompletionPacket) => {
  if (!Array.isArray(completionPacket.execution) || completionPacket.execution.length === 0) {
    return false;
  }
  const execution = completionPacket.execution.filter((item) => isExecutionRecord(item));
  if (execution.length !== completionPacket.execution.length) {
    return false;
  }
  const hasTestsField = Array.isArray(completionPacket.tests);
  const tests = hasTestsField
    ? completionPacket.tests.filter((item) => typeof item === "string" && isMeaningfulTestEvidence(item.trim()))
    : [];
  const hasFilesChangedField = Array.isArray(completionPacket.files_changed);
  const filesChanged = hasFilesChangedField
    ? completionPacket.files_changed.filter((item) => typeof item === "string" && isPathEvidence(item.trim()))
    : [];
  if (hasTestsField && tests.length === 0) {
    return false;
  }
  if (hasFilesChangedField && filesChanged.length === 0) {
    return false;
  }
  return execution.length > 0;
};

const normalizeEvidence = (completionPacket: TaskCompletionPacket): NormalizedEvidence => {
  const execution = Array.isArray(completionPacket.execution)
    ? completionPacket.execution
        .filter((item): item is ExecutionRecord => isExecutionRecord(item))
        .map((item) => ({
          command: item.command.trim(),
          exitCode: item.exitCode,
          outputSummary: item.outputSummary.trim(),
          outputDigest: item.outputDigest
        }))
    : [];
  const tests = Array.isArray(completionPacket.tests)
    ? completionPacket.tests
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && isMeaningfulTestEvidence(item))
    : [];
  const files_changed = Array.isArray(completionPacket.files_changed)
    ? completionPacket.files_changed
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && isPathEvidence(item))
    : [];

  return { execution, tests, files_changed };
};

const asTaskCompletionPacket = (value: unknown, taskId: string): TaskCompletionPacket | null => {
  if (!isRecord(value) || value.taskId !== taskId) {
    return null;
  }
  if (!hasOwn(value, "execution") || !isExecutionList(value.execution) || value.execution.length === 0) {
    return null;
  }
  if (hasOwn(value, "tests") && !isStringList(value.tests)) {
    return null;
  }
  if (hasOwn(value, "files_changed") && !isStringList(value.files_changed)) {
    return null;
  }
  return value as TaskCompletionPacket;
};

const asVerificationPacket = (
  value: unknown,
  taskId: string,
  passed: boolean
): VerificationPacket | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (!hasOnlyKeys(value, ["taskId", "passed"])) {
    return null;
  }
  if (value.taskId !== taskId || value.passed !== passed) {
    return null;
  }
  return value as VerificationPacket;
};

const asIntegrationPacket = (value: unknown, taskId: string): IntegrationPacket | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (!hasOnlyKeys(value, ["taskId", "passed", "checks"])) {
    return null;
  }
  if (hasOwn(value, "checks") && !isStringList(value.checks)) {
    return null;
  }
  if (value.taskId !== taskId || value.passed !== true) {
    return null;
  }
  return value as IntegrationPacket;
};

const asUxPacket = (value: unknown, taskId: string): UxPacket | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (!hasOnlyKeys(value, ["taskId", "passed", "journey_checks"])) {
    return null;
  }
  if (hasOwn(value, "journey_checks") && !isStringList(value.journey_checks)) {
    return null;
  }
  if (value.taskId !== taskId || value.passed !== true) {
    return null;
  }
  return value as UxPacket;
};

const findLastIndex = (receipts: ReceiptEnvelope[], predicate: (entry: ReceiptEnvelope) => boolean) => {
  for (let index = receipts.length - 1; index >= 0; index -= 1) {
    if (predicate(receipts[index])) {
      return index;
    }
  }
  return -1;
};

const findLastIndexAfter = (
  receipts: ReceiptEnvelope[],
  startExclusive: number,
  predicate: (entry: ReceiptEnvelope) => boolean
) => {
  for (let index = receipts.length - 1; index > startExclusive; index -= 1) {
    if (predicate(receipts[index])) {
      return index;
    }
  }
  return -1;
};

export function verifyReceipts(
  receipts: ReceiptEnvelope[],
  taskId: string,
  options: VerifyReceiptOptions = {}
): ReceiptEvidence | null {
  const executorIndex = findLastIndex(receipts, (entry) =>
    entry.receipt.type === "EXECUTOR_COMPLETED" &&
    entry.receipt.taskId === taskId &&
    asTaskCompletionPacket(entry.receipt.packet, taskId) !== null
  );
  const specIndex = findLastIndexAfter(receipts, executorIndex, (entry) =>
    entry.receipt.type === "VERIFIER_SPEC" &&
    entry.receipt.taskId === taskId &&
    entry.receipt.passed === true &&
    asVerificationPacket(entry.receipt.packet, taskId, true) !== null
  );
  const qualityIndex = findLastIndexAfter(receipts, executorIndex, (entry) =>
    entry.receipt.type === "VERIFIER_QUALITY" &&
    entry.receipt.taskId === taskId &&
    entry.receipt.passed === true &&
    asVerificationPacket(entry.receipt.packet, taskId, true) !== null
  );

  if (executorIndex < 0 || specIndex < 0 || qualityIndex < 0) {
    return null;
  }

  const executorPacket = asTaskCompletionPacket(receipts[executorIndex].receipt.packet, taskId);
  if (!executorPacket) {
    return null;
  }
  if (!hasMeaningfulEvidence(executorPacket)) {
    return null;
  }
  const normalizedEvidence = normalizeEvidence(executorPacket);

  let integrationIndex = -1;
  if (options.requiresIntegrationCheck === true) {
    integrationIndex = findLastIndexAfter(receipts, executorIndex, (entry) =>
      entry.receipt.type === "INTEGRATION_CHECKED" &&
      entry.receipt.taskId === taskId &&
      asIntegrationPacket(entry.receipt.packet, taskId) !== null
    );
    if (integrationIndex < 0) {
      return null;
    }
  }

  let uxIndex = -1;
  if (options.uxSensitive === true) {
    uxIndex = findLastIndexAfter(receipts, executorIndex, (entry) =>
      entry.receipt.type === "UX_SIMULATED" &&
      entry.receipt.taskId === taskId &&
      asUxPacket(entry.receipt.packet, taskId) !== null
    );
    if (uxIndex < 0) {
      return null;
    }
  }

  const evidence: ReceiptEvidence = {
    executor_receipt_id: getReceiptId(receipts[executorIndex], executorIndex),
    execution: normalizedEvidence.execution,
    verifier_receipt_ids: [
      getReceiptId(receipts[specIndex], specIndex),
      getReceiptId(receipts[qualityIndex], qualityIndex)
    ]
  };

  if (integrationIndex >= 0) {
    evidence.integration_receipt_id = getReceiptId(receipts[integrationIndex], integrationIndex);
  }
  if (uxIndex >= 0) {
    evidence.ux_receipt_id = getReceiptId(receipts[uxIndex], uxIndex);
  }
  if (normalizedEvidence.tests.length > 0) {
    evidence.tests = normalizedEvidence.tests;
  }
  if (normalizedEvidence.files_changed.length > 0) {
    evidence.files_changed = normalizedEvidence.files_changed;
  }

  return evidence;
}
