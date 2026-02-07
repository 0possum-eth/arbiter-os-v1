import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { arbiterDecision } from "../decisions/arbiterDecision";
import { bundleTasks, type BundleTask } from "../execute/bundleStrategy";
import { executeEpic } from "../execute/executeEpic";
import { ledgerKeeper } from "../ledger/ledgerKeeper";
import { runBrainstorm } from "../phases/brainstorm";
import { runElectrician } from "../phases/electrician";
import { runScout } from "../phases/scout";
import { runUxCoordinator } from "../phases/uxCoordinator";
import { emitReceipt } from "../receipts/emitReceipt";
import { markRunCompleted, markRunStarted } from "../receipts/runLifecycle";
import { createHaltAndAskReceipt, type ReceiptPayload } from "../receipts/types";
import { buildInstallPlan, type InstallPlan } from "../preflight/installPlanner";
import { executeInstallPlan } from "../preflight/installExecutor";
import { runRuntimeDoctor, type RuntimeDoctorResult } from "../preflight/runtimeDoctor";
import {
  resolveWorkflowExecutionProfile,
  resolveWorkflowMode,
  type WorkflowMode
} from "./workflowMode";
import { inspectState } from "../state/inspectState";

type RunEpicResult =
  | { type: "HALT_AND_ASK"; receipt: ReceiptPayload }
  | { type: "IN_PROGRESS" }
  | { type: "FINALIZED" };

type PrdTaskRecord = {
  id?: string;
  done?: boolean;
  noop?: boolean;
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

type RunEpicOptions = {
  workflowMode?: WorkflowMode | string;
  preflight?: {
    consentGranted: boolean;
    doctor: () => Promise<RuntimeDoctorResult>;
    planner: (doctorResult: RuntimeDoctorResult) => InstallPlan;
    executor: (plan: InstallPlan) => Promise<{ receipt: ReceiptPayload }>;
  };
};

const runShellCommand = async (command: string): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  const result = spawnSync(command, { shell: true, encoding: "utf8" });
  return {
    exitCode: result.status ?? 1,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : ""
  };
};

const buildDefaultPreflight = (): NonNullable<RunEpicOptions["preflight"]> => ({
  consentGranted: process.env.ARBITER_AUTO_INSTALL_CONSENT === "true",
  doctor: async () => runRuntimeDoctor({ rootDir: process.cwd() }),
  planner: (doctorResult) => buildInstallPlan(doctorResult),
  executor: async (plan) =>
    executeInstallPlan(plan, {
      consentGranted: true,
      runner: runShellCommand
    })
});

const getBundleLimit = async (maxBundleSize: number): Promise<number> => {
  const prdPath = path.join(process.cwd(), "docs", "arbiter", "prd.json");
  if (!fs.existsSync(prdPath)) return 1;

  try {
    const raw = await fs.promises.readFile(prdPath, "utf8");
    const prdState = JSON.parse(raw) as PrdState;
    const epics = Array.isArray(prdState.epics) ? prdState.epics : [];
    const activeEpic = epics.find((epic) => epic.id === prdState.activeEpicId);
    const tasks = Array.isArray(activeEpic?.tasks) ? activeEpic?.tasks : [];
    const pendingTasks: BundleTask[] = tasks
      .filter((task) => task.done !== true && task.noop !== true && typeof task.id === "string")
      .map((task) => ({
        id: task.id as string,
        artifactsToTouch: Array.isArray(task.artifactsToTouch) ? task.artifactsToTouch : undefined
      }));

    if (pendingTasks.length === 0) return 1;
    const bundle = bundleTasks(pendingTasks, { maxBundleSize });
    return bundle.length > 0 ? bundle.length : 1;
  } catch {
    return 1;
  }
};

export async function runEpicAutopilot(options: RunEpicOptions = {}): Promise<RunEpicResult> {
  markRunStarted();
  try {
    const workflowMode = resolveWorkflowMode(options.workflowMode);
    const workflowProfile = resolveWorkflowExecutionProfile(workflowMode, {
      continuousEnv: process.env.ARBITER_CONTINUOUS === "true"
    });
    const preflight = options.preflight ?? buildDefaultPreflight();
    const preflightResult = await preflight.doctor();
    if (!preflightResult.envReady) {
      const installPlan = preflight.planner(preflightResult);
      if (!preflight.consentGranted) {
        const haltReceipt = createHaltAndAskReceipt({
          reason: "ENV_NOT_READY",
          question: "Missing runtime dependencies detected. Allow assisted install to continue?",
          options: [
            {
              id: "allow_install",
              label: "Allow install",
              description: "Install missing prerequisites and toolchain"
            },
            {
              id: "manual_setup",
              label: "Manual setup",
              description: "I will install dependencies manually"
            }
          ]
        });
        await emitReceipt(haltReceipt);
        return { type: "HALT_AND_ASK", receipt: haltReceipt };
      }

      if (installPlan.actions.length > 0) {
        const installResult = await preflight.executor(installPlan);
        await emitReceipt(installResult.receipt);
      }

      const postInstallResult = await preflight.doctor();
      if (!postInstallResult.envReady) {
        const haltReceipt = createHaltAndAskReceipt({
          reason: "ENV_NOT_READY",
          question: "Assisted install completed but dependencies are still missing. Please finish setup manually."
        });
        await emitReceipt(haltReceipt);
        return { type: "HALT_AND_ASK", receipt: haltReceipt };
      }
    }

    const continuousMode = workflowProfile.continuousMode;
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

    let bundleLimit = await getBundleLimit(workflowProfile.maxBundleSize);
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
        bundleLimit = await getBundleLimit(workflowProfile.maxBundleSize);
        completedInRun = 0;
        continue;
      }
    }
  } finally {
    markRunCompleted();
  }
}
