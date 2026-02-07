import type {
  IntegrationPacket,
  OraclePacket,
  TaskCompletionPacket,
  UxPacket,
  VerificationPacket
} from "../contracts/packets";

type ScoutContractViolationReceipt = {
  type: "SCOUT_CONTRACT_VIOLATION";
  errors: Array<{ message: string; path?: string; keyword?: string }>;
};

type HaltRouteOption = {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
};

type HaltAndAskReceipt = {
  type: "HALT_AND_ASK";
  reason?: string;
  question?: string;
  epicId?: string;
  taskId?: string;
  options?: HaltRouteOption[];
  recommendedOptionId?: string;
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

type OracleReviewedReceipt = {
  type: "ORACLE_REVIEWED";
  taskId: string;
  packet: OraclePacket;
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
  | UxSimulatedReceipt["type"]
  | OracleReviewedReceipt["type"];
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
  | UxSimulatedReceipt
  | OracleReviewedReceipt;

export type {
  HaltRouteOption,
  ScoutContractViolationReceipt,
  HaltAndAskReceipt,
  RunFinalizedReceipt,
  EpicTasksDerivedReceipt,
  TaskCompletedReceipt,
  ExecutorCompletedReceipt,
  VerifierSpecReceipt,
  VerifierQualityReceipt,
  IntegrationCheckedReceipt,
  UxSimulatedReceipt,
  OracleReviewedReceipt
};

type CreateHaltAndAskReceiptInput = {
  reason?: string;
  question?: string;
  epicId?: string;
  taskId?: string;
  options?: HaltRouteOption[];
};

export const createHaltAndAskReceipt = (
  input: CreateHaltAndAskReceiptInput = {}
): HaltAndAskReceipt => {
  const options = Array.isArray(input.options) ? input.options : [];
  const normalizedOptions = options.map((option, index) => ({
    ...option,
    recommended: index === 0
  }));

  return {
    type: "HALT_AND_ASK",
    reason: input.reason,
    question: input.question,
    epicId: input.epicId,
    taskId: input.taskId,
    options: normalizedOptions.length > 0 ? normalizedOptions : undefined,
    recommendedOptionId: normalizedOptions.length > 0 ? normalizedOptions[0].id : undefined
  };
};
