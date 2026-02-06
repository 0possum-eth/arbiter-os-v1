import fs from "node:fs";
import path from "node:path";

import { arbiterDecision } from "../decisions/arbiterDecision";
import { bundleTasks, type BundleTask } from "../execute/bundleStrategy";
import { executeEpic } from "../execute/executeEpic";
import { ledgerKeeper } from "../ledger/ledgerKeeper";
import { runBrainstorm } from "../phases/brainstorm";
import { runElectrician } from "../phases/electrician";
import { runScout } from "../phases/scout";
import { runUxCoordinator } from "../phases/uxCoordinator";
import { emitReceipt } from "../receipts/emitReceipt";
import type { ReceiptPayload } from "../receipts/types";
import { inspectState } from "../state/inspectState";

type RunEpicResult =
  | { type: "HALT_AND_ASK"; receipt: ReceiptPayload }
  | { type: "IN_PROGRESS" }
  | { type: "FINALIZED" };

type PrdTaskRecord = {
  id?: string;
  done?: boolean;
  artifactsToTouch?: string[];
};

type PrdEpicRecord = {
  id?: string;
  tasks?: PrdTaskRecord[];
};

type PrdState = {
  activeEpicId?: string;
  epics?: PrdEpicRecord[];
};

const getBundleLimit = async (): Promise<number> => {
  const prdPath = path.join(process.cwd(), "docs", "arbiter", "prd.json");
  if (!fs.existsSync(prdPath)) return 1;

  try {
    const raw = await fs.promises.readFile(prdPath, "utf8");
    const prdState = JSON.parse(raw) as PrdState;
    const epics = Array.isArray(prdState.epics) ? prdState.epics : [];
    const activeEpic = epics.find((epic) => epic.id === prdState.activeEpicId);
    const tasks = Array.isArray(activeEpic?.tasks) ? activeEpic?.tasks : [];
    const pendingTasks: BundleTask[] = tasks
      .filter((task) => task.done !== true && typeof task.id === "string")
      .map((task) => ({
        id: task.id as string,
        artifactsToTouch: Array.isArray(task.artifactsToTouch) ? task.artifactsToTouch : undefined
      }));

    if (pendingTasks.length === 0) return 1;
    const bundle = bundleTasks(pendingTasks, { maxBundleSize: 2 });
    return bundle.length > 0 ? bundle.length : 1;
  } catch {
    return 1;
  }
};

export async function runEpicAutopilot(): Promise<RunEpicResult> {
  const continuousMode = process.env.ARBITER_CONTINUOUS === "true";
  const state = await inspectState();

  if (state.status === "NO_ACTIVE_EPIC") {
    await runBrainstorm();
    const scoutOutput = await runScout();
    const decision = await arbiterDecision(scoutOutput);

    if (decision.status === "HALT_AND_ASK") {
      await emitReceipt(decision.receipt);
      return { type: "HALT_AND_ASK", receipt: decision.receipt };
    }
  }

  let bundleLimit = await getBundleLimit();
  let completedInRun = 0;

  while (true) {
    const result = await executeEpic();

    if (result.type === "HALT_AND_ASK") {
      await emitReceipt(result.receipt);
      return { type: "HALT_AND_ASK", receipt: result.receipt };
    }

    if (result.type === "TASK_COMPLETED") {
      completedInRun += 1;
      if (!continuousMode && completedInRun >= bundleLimit) {
        return { type: "IN_PROGRESS" };
      }
      continue;
    }

    if (result.type === "PENDING_LEDGER") {
      const ledgerPath = "docs/arbiter/_ledger/prd.events.jsonl";
      const ledgerResult = await ledgerKeeper(ledgerPath, result.epicId, result.taskId);
      if (ledgerResult.status === "HALT_AND_ASK") {
        await emitReceipt({
          type: "HALT_AND_ASK",
          reason: ledgerResult.reason,
          epicId: result.epicId,
          taskId: result.taskId
        });
        return {
          type: "HALT_AND_ASK",
          receipt: {
            type: "HALT_AND_ASK",
            reason: ledgerResult.reason,
            epicId: result.epicId,
            taskId: result.taskId
          }
        };
      }

      completedInRun += 1;
      if (!continuousMode && completedInRun >= bundleLimit) {
        return { type: "IN_PROGRESS" };
      }
      continue;
    }

    if (result.type === "EPIC_COMPLETE") {
      const next = await inspectState();
      if (next.status === "NO_MORE_WORK") {
        await runElectrician();
        await runUxCoordinator();
        await emitReceipt({ type: "RUN_FINALIZED" });
        return { type: "FINALIZED" };
      }
      bundleLimit = await getBundleLimit();
      completedInRun = 0;
      continue;
    }
  }
}
