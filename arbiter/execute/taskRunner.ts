import { buildTaskPacket } from "./taskPacket";

export type TaskExecutionResult =
  | { type: "TASK_DONE" }
  | { type: "HALT_AND_ASK"; reason: string };

type TaskRecord = {
  id?: string;
  query?: string;
  noop?: boolean;
};

const normalizeTaskRecord = (task: Record<string, unknown>): TaskRecord => ({
  id: typeof task.id === "string" ? task.id : undefined,
  query: typeof task.query === "string" ? task.query : undefined,
  noop: task.noop === true
});

export async function runTask(task: Record<string, unknown>): Promise<TaskExecutionResult> {
  const runtimeTask = normalizeTaskRecord(task);

  if (runtimeTask.noop === true) {
    return { type: "TASK_DONE" };
  }

  const packet = await buildTaskPacket(runtimeTask);
  if (packet.taskId === "UNKNOWN_TASK") {
    return { type: "HALT_AND_ASK", reason: "TASK_ID_MISSING" };
  }

  if (packet.citations.length === 0) {
    return { type: "HALT_AND_ASK", reason: "CONTEXT_PACK_REQUIRED" };
  }

  return {
    type: "HALT_AND_ASK",
    reason: "Task has no execution strategy yet"
  };
}
