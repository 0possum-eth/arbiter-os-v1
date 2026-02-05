import fs from "node:fs";
import path from "node:path";

import type { ReceiptPayload } from "./types";

type ReceiptEnvelope = {
  ts: string;
  runId: string;
  receipt: ReceiptPayload;
};

const resolveRunId = () => {
  const envRunId = process.env.ARBITER_RUN_ID;
  if (envRunId && envRunId.trim()) return envRunId.trim();
  return "unknown";
};

export async function emitReceipt(receipt: ReceiptPayload): Promise<void> {
  const rootDir = process.cwd();
  const ledgerDir = path.join(rootDir, "docs", "arbiter", "_ledger", "receipts");
  await fs.promises.mkdir(ledgerDir, { recursive: true });

  const envelope: ReceiptEnvelope = {
    ts: new Date().toISOString(),
    runId: resolveRunId(),
    receipt
  };

  const line = `${JSON.stringify(envelope)}\n`;
  const ledgerPath = path.join(ledgerDir, "receipts.jsonl");
  await fs.promises.appendFile(ledgerPath, line, "utf8");
}
