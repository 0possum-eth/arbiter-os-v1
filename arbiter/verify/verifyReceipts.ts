type Receipt = { type: string; taskId?: string; passed?: boolean };

export function verifyReceipts(receipts: Receipt[], taskId: string) {
  const executor = receipts.find((receipt) =>
    receipt.type === "EXECUTOR_COMPLETED" && receipt.taskId === taskId
  );
  const spec = receipts.find((receipt) =>
    receipt.type === "VERIFIER_SPEC" && receipt.taskId === taskId && receipt.passed === true
  );
  const quality = receipts.find((receipt) =>
    receipt.type === "VERIFIER_QUALITY" && receipt.taskId === taskId && receipt.passed === true
  );

  return !!executor && !!spec && !!quality;
}
