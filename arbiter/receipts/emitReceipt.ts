import fs from "node:fs";
import path from "node:path";

import type { ReceiptPayload } from "./types";
import { recordRunUpdate } from "../ledger/runs";
import { markRunStarted } from "./runLifecycle";

type ReceiptEnvelope = {
  ts: string;
  runId: string;
  receipt: ReceiptPayload;
};

export async function emitReceipt(receipt: ReceiptPayload): Promise<void> {
  const rootDir = process.cwd();
  const { runId } = markRunStarted();
  const ledgerDir = path.join(rootDir, "docs", "arbiter", "_ledger", "runs", runId);
  await fs.promises.mkdir(ledgerDir, { recursive: true });

  const envelope: ReceiptEnvelope = {
    ts: new Date().toISOString(),
    runId,
    receipt
  };

  const line = `${JSON.stringify(envelope)}\n`;
  const receiptsPath = path.join(ledgerDir, "receipts.jsonl");
  await fs.promises.appendFile(receiptsPath, line, "utf8");

  const runsLedgerPath = path.join(rootDir, "docs", "arbiter", "_ledger", "runs.jsonl");
  await recordRunUpdate(runsLedgerPath, runId);
}
