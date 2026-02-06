import type {
  IntegrationPacket,
  TaskCompletionPacket,
  UxPacket,
  VerificationPacket
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
  tests?: string[];
  files_changed?: string[];
};

type VerifyReceiptOptions = {
  requiresIntegrationCheck?: boolean;
  uxSensitive?: boolean;
};

const getReceiptId = (envelope: ReceiptEnvelope, index: number) =>
  envelope.id ?? envelope.receiptId ?? envelope.ts ?? `receipt-${index + 1}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const asTaskCompletionPacket = (value: unknown, taskId: string): TaskCompletionPacket | null => {
  if (!isRecord(value) || value.taskId !== taskId) {
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
  if (value.taskId !== taskId || value.passed !== passed) {
    return null;
  }
  return value as VerificationPacket;
};

const asIntegrationPacket = (value: unknown, taskId: string): IntegrationPacket | null => {
  if (!isRecord(value)) {
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
  if (isStringList(executorPacket.tests)) {
    evidence.tests = executorPacket.tests;
  }
  if (isStringList(executorPacket.files_changed)) {
    evidence.files_changed = executorPacket.files_changed;
  }

  return evidence;
}
