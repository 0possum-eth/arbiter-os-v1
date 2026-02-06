import fs from "node:fs";
import path from "node:path";

import { appendEvent } from "./appendEvent";
import { buildViews } from "./buildViews";
import { verifyReceipts } from "../verify/verifyReceipts";

type LedgerKeeperResult =
  | { status: "OK" }
  | { status: "HALT_AND_ASK"; reason: string };

type EpicRecord = {
  id?: string;
  tasks?: Array<{
    id?: string;
    noop?: boolean;
    requiresInput?: boolean;
    requiresInputReason?: string;
  }>;
};

type PrdState = {
  activeEpicId?: string;
  epics?: EpicRecord[];
};

type Receipt = {
  type: string;
  taskId?: string;
  passed?: boolean;
  tests?: unknown;
  files_changed?: unknown;
};
type ReceiptEnvelope = { id?: string; receiptId?: string; ts?: string; receipt: Receipt };

export async function ledgerKeeper(
  ledgerPath: string,
  epicId: string,
  taskId: string
): Promise<LedgerKeeperResult> {
  const ledgerDir = path.dirname(ledgerPath);
  const rootDir = path.resolve(ledgerDir, "..", "..", "..");
  const receiptsPath = path.join(rootDir, "docs", "arbiter", "_ledger", "receipts", "receipts.jsonl");
  if (!fs.existsSync(receiptsPath)) {
    return { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" };
  }

  let receiptLines: Record<string, unknown>[] = [];
  try {
    receiptLines = (await fs.promises.readFile(receiptsPath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch (error) {
    return { status: "HALT_AND_ASK", reason: "RECEIPTS_INVALID" };
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
  const evidence = verifyReceipts(receipts, taskId);
  if (!evidence) {
    return { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" };
  }

  const prdPath = path.join(rootDir, "docs", "arbiter", "prd.json");
  let prdState: PrdState;
  try {
    const raw = await fs.promises.readFile(prdPath, "utf8");
    prdState = JSON.parse(raw) as PrdState;
  } catch (error) {
    return { status: "HALT_AND_ASK", reason: "PRD_INVALID" };
  }
  const epics = Array.isArray(prdState.epics) ? prdState.epics : [];
  const epic = epics.find((item) => item.id === epicId);
  const tasks = Array.isArray(epic?.tasks) ? epic?.tasks : [];
  const isTaskInEpic = tasks.some((task) => task.id === taskId);
  if (!isTaskInEpic) {
    return { status: "HALT_AND_ASK", reason: "TASK_NOT_IN_EPIC" };
  }

  const now = new Date().toISOString();
  await appendEvent(ledgerPath, {
    ts: now,
    op: "epic_selected",
    id: epicId,
    data: { epicId }
  });

  for (const task of tasks) {
    if (!task.id) continue;
    await appendEvent(ledgerPath, {
      ts: now,
      op: "task_upsert",
      id: task.id,
      data: {
        epicId,
        task: {
          noop: task.noop,
          requiresInput: task.requiresInput,
          requiresInputReason: task.requiresInputReason
        }
      }
    });
  }

  await appendEvent(ledgerPath, {
    ts: now,
    op: "task_done",
    id: taskId,
    data: { epicId, evidence }
  });

  await buildViews(ledgerPath, path.join(rootDir, "docs", "arbiter"));

  return { status: "OK" };
}
