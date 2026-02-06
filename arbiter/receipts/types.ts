import type {
  IntegrationPacket,
  TaskCompletionPacket,
  UxPacket,
  VerificationPacket
} from "../contracts/packets";

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

type ExecutorCompletedReceipt = {
  type: "EXECUTOR_COMPLETED";
  taskId: string;
  packet: TaskCompletionPacket;
};

type VerifierSpecReceipt = {
  type: "VERIFIER_SPEC";
  taskId: string;
  passed: boolean;
  packet: VerificationPacket;
};

type VerifierQualityReceipt = {
  type: "VERIFIER_QUALITY";
  taskId: string;
  passed: boolean;
  packet: VerificationPacket;
};

type IntegrationCheckedReceipt = {
  type: "INTEGRATION_CHECKED";
  taskId: string;
  packet: IntegrationPacket;
};

type UxSimulatedReceipt = {
  type: "UX_SIMULATED";
  taskId: string;
  packet: UxPacket;
};

export type ReceiptType =
  | ScoutContractViolationReceipt["type"]
  | HaltAndAskReceipt["type"]
  | RunFinalizedReceipt["type"]
  | EpicTasksDerivedReceipt["type"]
  | TaskCompletedReceipt["type"]
  | ExecutorCompletedReceipt["type"]
  | VerifierSpecReceipt["type"]
  | VerifierQualityReceipt["type"]
  | IntegrationCheckedReceipt["type"]
  | UxSimulatedReceipt["type"];
export type ReceiptPayload =
  | ScoutContractViolationReceipt
  | HaltAndAskReceipt
  | RunFinalizedReceipt
  | EpicTasksDerivedReceipt
  | TaskCompletedReceipt
  | ExecutorCompletedReceipt
  | VerifierSpecReceipt
  | VerifierQualityReceipt
  | IntegrationCheckedReceipt
  | UxSimulatedReceipt;

export type {
  ScoutContractViolationReceipt,
  HaltAndAskReceipt,
  RunFinalizedReceipt,
  EpicTasksDerivedReceipt,
  TaskCompletedReceipt,
  ExecutorCompletedReceipt,
  VerifierSpecReceipt,
  VerifierQualityReceipt,
  IntegrationCheckedReceipt,
  UxSimulatedReceipt
};
