export type TaskExecutionResult =
  | { type: "TASK_DONE" }
  | { type: "HALT_AND_ASK"; reason: string };

export async function runTask(task: Record<string, unknown>): Promise<TaskExecutionResult> {
  if (task.noop === true) {
    return { type: "TASK_DONE" };
  }

  return {
    type: "HALT_AND_ASK",
    reason: "Task has no execution strategy yet"
  };
}
