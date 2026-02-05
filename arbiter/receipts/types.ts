type ScoutContractViolationReceipt = {
  type: "SCOUT_CONTRACT_VIOLATION";
  errors: Array<{ message: string; path?: string; keyword?: string }>;
};

type HaltAndAskReceipt = {
  type: "HALT_AND_ASK";
  reason?: string;
  question?: string;
  epicId?: string;
  taskId?: string;
};

type RunFinalizedReceipt = {
  type: "RUN_FINALIZED";
  summary?: string;
};

type EpicTasksDerivedReceipt = {
  type: "EPIC_TASKS_DERIVED";
  epicId: string;
  taskIds: string[];
};

type TaskCompletedReceipt = {
  type: "TASK_COMPLETED";
  epicId: string;
  taskId: string;
};

export type ReceiptType =
  | ScoutContractViolationReceipt["type"]
  | HaltAndAskReceipt["type"]
  | RunFinalizedReceipt["type"]
  | EpicTasksDerivedReceipt["type"]
  | TaskCompletedReceipt["type"];
export type ReceiptPayload =
  | ScoutContractViolationReceipt
  | HaltAndAskReceipt
  | RunFinalizedReceipt
  | EpicTasksDerivedReceipt
  | TaskCompletedReceipt;

export type {
  ScoutContractViolationReceipt,
  HaltAndAskReceipt,
  RunFinalizedReceipt,
  EpicTasksDerivedReceipt,
  TaskCompletedReceipt
};
