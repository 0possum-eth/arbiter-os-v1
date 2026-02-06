type Receipt = { type: string; taskId?: string; passed?: boolean };
type ReceiptEnvelope = { id?: string; receiptId?: string; ts?: string; receipt: Receipt };

const getReceiptId = (envelope: ReceiptEnvelope, index: number) =>
  envelope.id ?? envelope.receiptId ?? envelope.ts ?? `receipt-${index + 1}`;

export function verifyReceipts(receipts: ReceiptEnvelope[], taskId: string): string[] | null {
  const executorIndex = receipts.findIndex((entry) =>
    entry.receipt.type === "EXECUTOR_COMPLETED" && entry.receipt.taskId === taskId
  );
  const specIndex = receipts.findIndex((entry) =>
    entry.receipt.type === "VERIFIER_SPEC" && entry.receipt.taskId === taskId && entry.receipt.passed === true
  );
  const qualityIndex = receipts.findIndex((entry) =>
    entry.receipt.type === "VERIFIER_QUALITY" && entry.receipt.taskId === taskId && entry.receipt.passed === true
  );

  if (executorIndex < 0 || specIndex < 0 || qualityIndex < 0) {
    return null;
  }

  return [
    getReceiptId(receipts[executorIndex], executorIndex),
    getReceiptId(receipts[specIndex], specIndex),
    getReceiptId(receipts[qualityIndex], qualityIndex)
  ];
}
