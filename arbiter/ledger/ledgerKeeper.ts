import fs from "node:fs";
import path from "node:path";

import { appendEvent } from "./appendEvent";
import { buildViews } from "./buildViews";
import { readRunReceipts } from "../receipts/readRunReceipts";
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
    requiresIntegrationCheck?: boolean;
    uxSensitive?: boolean;
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
  const ledgerDir = path.dirname(ledgerPath);
  const rootDir = path.resolve(ledgerDir, "..", "..", "..");
  const receiptResult = await readRunReceipts(rootDir);
  if (receiptResult.status === "MISSING") {
    return { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" };
  }

  if (receiptResult.status === "INVALID") {
    return { status: "HALT_AND_ASK", reason: "RECEIPTS_INVALID" };
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
  const selectedTask = tasks.find((task) => task.id === taskId);
  if (!selectedTask) {
    return { status: "HALT_AND_ASK", reason: "TASK_NOT_IN_EPIC" };
  }

  const evidence = verifyReceipts(receiptResult.receipts, taskId, {
    requiresIntegrationCheck: selectedTask.requiresIntegrationCheck === true,
    uxSensitive: selectedTask.uxSensitive === true
  });
  if (!evidence) {
    return { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" };
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
          requiresInputReason: task.requiresInputReason,
          requiresIntegrationCheck: task.requiresIntegrationCheck,
          uxSensitive: task.uxSensitive
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
