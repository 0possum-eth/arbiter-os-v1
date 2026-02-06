import { buildTaskPacket } from "./taskPacket";

export type TaskExecutionResult =
  | { type: "TASK_DONE" }
  | { type: "HALT_AND_ASK"; reason: string };

type TaskRecord = {
  id?: string;
  query?: string;
  noop?: boolean;
};

export async function runTask(task: Record<string, unknown>): Promise<TaskExecutionResult> {
  if (task.noop === true) {
    return { type: "TASK_DONE" };
  }

  const packet = await buildTaskPacket(task as TaskRecord);
  if (packet.taskId === "UNKNOWN_TASK") {
    return { type: "HALT_AND_ASK", reason: "TASK_ID_MISSING" };
  }

  return {
    type: "HALT_AND_ASK",
    reason: "Task has no execution strategy yet"
  };
}
