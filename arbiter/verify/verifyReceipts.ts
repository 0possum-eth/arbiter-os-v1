type Receipt = {
  type: string;
  taskId?: string;
  passed?: boolean;
  tests?: unknown;
  files_changed?: unknown;
};
type ReceiptEnvelope = { id?: string; receiptId?: string; ts?: string; receipt: Receipt };

export type ReceiptEvidence = {
  executor_receipt_id: string;
  verifier_receipt_ids: string[];
  tests?: string[];
  files_changed?: string[];
};

const getReceiptId = (envelope: ReceiptEnvelope, index: number) =>
  envelope.id ?? envelope.receiptId ?? envelope.ts ?? `receipt-${index + 1}`;

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const findLastIndex = (receipts: ReceiptEnvelope[], predicate: (entry: ReceiptEnvelope) => boolean) => {
  for (let index = receipts.length - 1; index >= 0; index -= 1) {
    if (predicate(receipts[index])) {
      return index;
    }
  }
  return -1;
};

export function verifyReceipts(receipts: ReceiptEnvelope[], taskId: string): ReceiptEvidence | null {
  const executorIndex = findLastIndex(receipts, (entry) =>
    entry.receipt.type === "EXECUTOR_COMPLETED" && entry.receipt.taskId === taskId
  );
  const specIndex = findLastIndex(receipts, (entry) =>
    entry.receipt.type === "VERIFIER_SPEC" && entry.receipt.taskId === taskId && entry.receipt.passed === true
  );
  const qualityIndex = findLastIndex(receipts, (entry) =>
    entry.receipt.type === "VERIFIER_QUALITY" && entry.receipt.taskId === taskId && entry.receipt.passed === true
  );

  if (executorIndex < 0 || specIndex < 0 || qualityIndex < 0) {
    return null;
  }

  const executorReceipt = receipts[executorIndex].receipt;
  const evidence: ReceiptEvidence = {
    executor_receipt_id: getReceiptId(receipts[executorIndex], executorIndex),
    verifier_receipt_ids: [
      getReceiptId(receipts[specIndex], specIndex),
      getReceiptId(receipts[qualityIndex], qualityIndex)
    ]
  };

  if (hasOwn(executorReceipt, "tests")) {
    evidence.tests = toStringList(executorReceipt.tests);
  }
  if (hasOwn(executorReceipt, "files_changed")) {
    evidence.files_changed = toStringList(executorReceipt.files_changed);
  }

  return evidence;
}
