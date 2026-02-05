import {
  validateScoutSynthesis,
  type ScoutContractViolationError
} from "../validators/validateScoutSynthesis";
import type { ScoutContractViolationReceipt } from "../receipts/types";

type ArbiterDecisionResult =
  | {
      status: "OK";
      scoutSynthesis: unknown;
    }
  | {
      status: "HALT_AND_ASK";
      receipt: ScoutContractViolationReceipt;
    };

const isScoutContractViolation = (
  error: unknown
): error is ScoutContractViolationError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "SCOUT_CONTRACT_VIOLATION" &&
    "errors" in error
  );
};

export function arbiterDecision(rawScoutOutput: unknown): ArbiterDecisionResult {
  try {
    const scoutSynthesis = validateScoutSynthesis(rawScoutOutput);
    return { status: "OK", scoutSynthesis };
  } catch (error) {
    if (isScoutContractViolation(error)) {
      return {
        status: "HALT_AND_ASK",
        receipt: {
          type: "SCOUT_CONTRACT_VIOLATION",
          errors: error.errors
        }
      };
    }
    throw error;
  }
}
