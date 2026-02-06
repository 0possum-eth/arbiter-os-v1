import { buildTaskPacket } from "./taskPacket";
import { executeTaskStrategy } from "./executeTaskStrategy";
import { emitReceipt } from "../receipts/emitReceipt";
import { runElectrician } from "../phases/electrician";
import { runUxCoordinator } from "../phases/uxCoordinator";
import { verifySpec } from "../verify/specVerifier";
import { verifyQuality } from "../verify/qualityVerifier";
import type { TaskCompletionPacket, VerificationPacket } from "../contracts/packets";
import type { ReceiptPayload } from "../receipts/types";
import { normalizeStrategyCommands, type StrategyCommand, type TaskPacket } from "./taskPacket";

export type TaskExecutionResult =
  | { type: "TASK_DONE" }
  | { type: "HALT_AND_ASK"; reason: string };

type TaskRecord = {
  id?: string;
  query?: string;
  noop?: boolean;
  requiresIntegrationCheck?: boolean;
  uxSensitive?: boolean;
  strategyCommands?: StrategyCommand[];
};

export type RunTaskDependencies = {
  buildTaskPacket: (task: TaskRecord) => Promise<TaskPacket>;
  executeTaskStrategy: (packet: TaskPacket) => Promise<TaskCompletionPacket>;
  verifySpec: (packet: TaskPacket, completionPacket: TaskCompletionPacket) => Promise<VerificationPacket>;
  verifyQuality: (packet: TaskPacket, completionPacket: TaskCompletionPacket) => Promise<VerificationPacket>;
  runElectrician: (packet: TaskPacket) => Promise<void>;
  runUxCoordinator: (packet: TaskPacket) => Promise<void>;
  emitReceipt: (receipt: ReceiptPayload) => Promise<void>;
};

const defaultRunTaskDependencies: RunTaskDependencies = {
  buildTaskPacket,
  executeTaskStrategy,
  verifySpec,
  verifyQuality,
  runElectrician,
  runUxCoordinator,
  emitReceipt
};

const normalizeTaskRecord = (task: Record<string, unknown>): TaskRecord => ({
  id: typeof task.id === "string" ? task.id : undefined,
  query: typeof task.query === "string" ? task.query : undefined,
  noop: task.noop === true,
  requiresIntegrationCheck: task.requiresIntegrationCheck === true,
  uxSensitive: task.uxSensitive === true,
  strategyCommands: normalizeStrategyCommands(task.strategyCommands)
});

export async function runTask(
  task: Record<string, unknown>,
  dependencies: Partial<RunTaskDependencies> = {}
): Promise<TaskExecutionResult> {
  const deps: RunTaskDependencies = {
    ...defaultRunTaskDependencies,
    ...dependencies
  };
  const runtimeTask = normalizeTaskRecord(task);

  if (runtimeTask.noop === true) {
    return { type: "TASK_DONE" };
  }

  const packet = await deps.buildTaskPacket(runtimeTask);
  if (packet.taskId === "UNKNOWN_TASK") {
    return { type: "HALT_AND_ASK", reason: "TASK_ID_MISSING" };
  }

  if (packet.citations.length === 0) {
    return { type: "HALT_AND_ASK", reason: "CONTEXT_PACK_REQUIRED" };
  }

  let completionPacket: TaskCompletionPacket;
  try {
    completionPacket = await deps.executeTaskStrategy(packet);
  } catch (error) {
    const message = error instanceof Error ? error.message.trim() : "strategy error";
    const detail = message.length > 60 ? `${message.slice(0, 60)}...` : message;
    return { type: "HALT_AND_ASK", reason: `TASK_STRATEGY_FAILED: ${detail}` };
  }
  await deps.emitReceipt({
    type: "EXECUTOR_COMPLETED",
    taskId: packet.taskId,
    packet: completionPacket
  });

  const specPacket = await deps.verifySpec(packet, completionPacket);
  await deps.emitReceipt({
    type: "VERIFIER_SPEC",
    taskId: packet.taskId,
    passed: specPacket.passed,
    packet: specPacket
  });
  if (specPacket.taskId !== packet.taskId || specPacket.passed !== true) {
    return {
      type: "HALT_AND_ASK",
      reason: "SPEC_VERIFICATION_FAILED"
    };
  }

  const qualityPacket = await deps.verifyQuality(packet, completionPacket);
  await deps.emitReceipt({
    type: "VERIFIER_QUALITY",
    taskId: packet.taskId,
    passed: qualityPacket.passed,
    packet: qualityPacket
  });
  if (qualityPacket.taskId !== packet.taskId || qualityPacket.passed !== true) {
    return {
      type: "HALT_AND_ASK",
      reason: "QUALITY_VERIFICATION_FAILED"
    };
  }

  if (runtimeTask.requiresIntegrationCheck === true) {
    await deps.runElectrician(packet);
  }

  if (runtimeTask.uxSensitive === true) {
    await deps.runUxCoordinator(packet);
  }

  return { type: "TASK_DONE" };
}
