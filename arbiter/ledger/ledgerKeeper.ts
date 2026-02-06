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

export async function ledgerKeeper(
  ledgerPath: string,
  epicId: string,
  taskId: string
): Promise<LedgerKeeperResult> {
  const rootDir = process.cwd();
  const receiptsPath = path.join(rootDir, "docs", "arbiter", "_ledger", "receipts", "receipts.jsonl");
  if (!fs.existsSync(receiptsPath)) {
    return { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" };
  }

  const receiptLines = (await fs.promises.readFile(receiptsPath, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { receipt: { type: string; taskId?: string; passed?: boolean } });
  const receipts = receiptLines.map((entry) => entry.receipt);
  if (!verifyReceipts(receipts, taskId)) {
    return { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" };
  }

  const prdPath = path.join(rootDir, "docs", "arbiter", "prd.json");
  const raw = await fs.promises.readFile(prdPath, "utf8");
  const prdState = JSON.parse(raw) as PrdState;
  const epics = Array.isArray(prdState.epics) ? prdState.epics : [];
  const epic = epics.find((item) => item.id === epicId);
  const tasks = Array.isArray(epic?.tasks) ? epic?.tasks : [];

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
    data: { epicId }
  });

  await buildViews(ledgerPath, path.join(rootDir, "docs", "arbiter"));

  return { status: "OK" };
}
