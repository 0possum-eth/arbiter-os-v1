import fs from "node:fs";
import path from "node:path";

import { appendEvent } from "../ledger/appendEvent";
import { buildViews } from "../ledger/buildViews";
import { emitReceipt } from "../receipts/emitReceipt";
import type { HaltAndAskReceipt } from "../receipts/types";
import { verifyReceipts } from "../verify/verifyReceipts";
import { runTask } from "./taskRunner";

type ExecuteEpicResult =
  | { type: "EPIC_COMPLETE"; epicId: string }
  | { type: "TASK_COMPLETED"; epicId: string; taskId: string }
  | { type: "HALT_AND_ASK"; receipt: HaltAndAskReceipt };

type EpicRecord = {
  id?: string;
  tasks?: Array<{
    id?: string;
    done?: boolean;
    requiresInput?: boolean;
    requiresInputReason?: string;
    noop?: boolean;
  }>;
  status?: string;
  done?: boolean;
  completed?: boolean;
};

type PrdState = {
  activeEpicId?: string;
  epics?: EpicRecord[];
};

const halt = (reason: string, epicId?: string, taskId?: string): ExecuteEpicResult => ({
  type: "HALT_AND_ASK",
  receipt: { type: "HALT_AND_ASK", reason, epicId, taskId }
});

const isEpicDone = (epic: EpicRecord) => {
  if (epic.done === true || epic.completed === true) return true;
  if (!epic.status) return false;
  const normalized = epic.status.toLowerCase();
  return normalized === "done" || normalized === "completed";
};

export async function executeEpic(): Promise<ExecuteEpicResult> {
  const rootDir = process.cwd();
  const prdPath = path.join(rootDir, "docs", "arbiter", "prd.json");

  if (!fs.existsSync(prdPath)) {
    return halt("PRD_NOT_FOUND");
  }

  let prdState: PrdState;
  try {
    const raw = await fs.promises.readFile(prdPath, "utf8");
    prdState = JSON.parse(raw) as PrdState;
  } catch {
    return halt("PRD_INVALID_JSON");
  }

  if (!prdState.activeEpicId) {
    return halt("NO_ACTIVE_EPIC");
  }

  const epics = Array.isArray(prdState.epics) ? prdState.epics : [];
  const epicIndex = epics.findIndex((epic) => epic.id === prdState.activeEpicId);
  if (epicIndex === -1) {
    return halt("ACTIVE_EPIC_NOT_FOUND");
  }

  const activeEpic = epics[epicIndex];
  if (isEpicDone(activeEpic)) {
    return halt("ACTIVE_EPIC_ALREADY_DONE");
  }

  const tasks = Array.isArray(activeEpic.tasks) ? activeEpic.tasks : [];
  if (tasks.length === 0) {
    return halt("EPIC_TASKS_MISSING");
  }

  const taskIds = tasks.map((task) => task.id).filter((id): id is string => !!id);
  if (taskIds.length === 0) {
    return halt("EPIC_TASK_IDS_MISSING");
  }

  await emitReceipt({
    type: "EPIC_TASKS_DERIVED",
    epicId: prdState.activeEpicId,
    taskIds
  });

  const nextTaskIndex = tasks.findIndex((task) => task.done !== true);
  if (nextTaskIndex === -1) {
    return { type: "EPIC_COMPLETE", epicId: prdState.activeEpicId };
  }

  const nextTask = tasks[nextTaskIndex];
  if (!nextTask.id) {
    return halt("TASK_ID_MISSING");
  }

  if (nextTask.requiresInput === true) {
    const reason = nextTask.requiresInputReason || "TASK_REQUIRES_EXTERNAL_INPUT";
    return halt(reason, prdState.activeEpicId, nextTask.id);
  }

  const taskResult = await runTask(nextTask as Record<string, unknown>);
  if (taskResult.type === "HALT_AND_ASK") {
    return halt(taskResult.reason, prdState.activeEpicId, nextTask.id);
  }

  const receiptsPath = path.join(rootDir, "docs", "arbiter", "_ledger", "receipts", "receipts.jsonl");
  if (!fs.existsSync(receiptsPath)) {
    return halt("VERIFICATION_REQUIRED", prdState.activeEpicId, nextTask.id);
  }

  const receiptLines = (await fs.promises.readFile(receiptsPath, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { receipt: { type: string; taskId?: string; passed?: boolean } });
  const receipts = receiptLines.map((entry) => entry.receipt);
  if (!verifyReceipts(receipts, nextTask.id)) {
    return halt("VERIFICATION_REQUIRED", prdState.activeEpicId, nextTask.id);
  }

  const updatedTasks = [...tasks];
  updatedTasks[nextTaskIndex] = {
    ...nextTask,
    done: true
  };

  const allTasksDone = updatedTasks.every((task) => task.done === true);

  const ledgerPath = path.join(rootDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
  const now = new Date().toISOString();
  for (const task of tasks) {
    if (!task.id) continue;
    await appendEvent(ledgerPath, {
      ts: now,
      op: "task_upsert",
      id: task.id,
      data: {
        epicId: prdState.activeEpicId,
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
    op: "epic_selected",
    id: prdState.activeEpicId,
    data: { epicId: prdState.activeEpicId }
  });
  await appendEvent(ledgerPath, {
    ts: now,
    op: "task_done",
    id: nextTask.id,
    data: { epicId: prdState.activeEpicId }
  });
  await buildViews(ledgerPath, path.join(rootDir, "docs", "arbiter"));

  await emitReceipt({
    type: "TASK_COMPLETED",
    epicId: prdState.activeEpicId,
    taskId: nextTask.id
  });

  if (allTasksDone) {
    return { type: "EPIC_COMPLETE", epicId: prdState.activeEpicId };
  }

  return { type: "TASK_COMPLETED", epicId: prdState.activeEpicId, taskId: nextTask.id };
}
