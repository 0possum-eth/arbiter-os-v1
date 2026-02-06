import fs from "node:fs";
import path from "node:path";

import { getRunId } from "./runContext";

type Receipt = {
  type: string;
  taskId?: string;
  passed?: boolean;
  tests?: unknown;
  files_changed?: unknown;
};

export type ReceiptEnvelope = { id?: string; receiptId?: string; ts?: string; receipt: Receipt };

export type ReadRunReceiptsResult =
  | { status: "OK"; receipts: ReceiptEnvelope[] }
  | { status: "MISSING" }
  | { status: "INVALID" };

export async function readRunReceipts(rootDir: string): Promise<ReadRunReceiptsResult> {
  const runId = getRunId();
  const receiptsPath = path.join(rootDir, "docs", "arbiter", "_ledger", "runs", runId, "receipts.jsonl");

  if (!fs.existsSync(receiptsPath)) {
    return { status: "MISSING" };
  }

  let receiptLines: Record<string, unknown>[] = [];
  try {
    receiptLines = (await fs.promises.readFile(receiptsPath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return { status: "INVALID" };
  }

  const receipts: ReceiptEnvelope[] = receiptLines.map((entry) => {
    if (entry && typeof entry === "object" && "receipt" in entry) {
      const envelope = entry as { receipt?: Receipt; id?: string; receiptId?: string; ts?: string };
      if (envelope.receipt) {
        return {
          receipt: envelope.receipt,
          id: envelope.id,
          receiptId: envelope.receiptId,
          ts: envelope.ts
        };
      }
    }

    return { receipt: entry as Receipt };
  });

  return { status: "OK", receipts };
}
