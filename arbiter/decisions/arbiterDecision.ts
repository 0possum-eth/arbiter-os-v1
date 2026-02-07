import path from "node:path";

import {
  validateScoutSynthesis,
  type ScoutContractViolationError
} from "../validators/validateScoutSynthesis";
import { pickBestScoutCandidate } from "../scout/candidateScoring";
import { queryMemory } from "../memory/query";
import type { MemoryEntry } from "../memory/store";
import { activateEpic } from "../state/activateEpic";
import type { ScoutContractViolationReceipt } from "../receipts/types";

type ArbiterDecisionResult =
  | {
      status: "PROCEED";
      scoutSynthesis: unknown;
      memoryContext: MemoryEntry[];
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

export async function arbiterDecision(rawScoutOutput: unknown): Promise<ArbiterDecisionResult> {
  try {
    const scoutSynthesis = validateScoutSynthesis(rawScoutOutput) as {
      candidates: Array<{ id: string; title?: string; intent?: string; artifactsToTouch?: string[] }>;
      recommendation: { candidateId: string };
      summary?: { problemStatement?: string };
      failureMode?: unknown;
    };

    const recommendedCandidate = scoutSynthesis.candidates.find(
      (item) => item.id === scoutSynthesis.recommendation.candidateId
    );

    const executionReadyCandidate = pickBestScoutCandidate(
      scoutSynthesis.candidates,
      scoutSynthesis.recommendation.candidateId
    );

    const candidate = executionReadyCandidate ?? recommendedCandidate;

    if (!candidate) {
      return {
        status: "HALT_AND_ASK",
        receipt: {
          type: "SCOUT_CONTRACT_VIOLATION",
          errors: [{ message: "recommended candidate missing from list" }]
        }
      };
    }

    const tasks = candidate.artifactsToTouch && candidate.artifactsToTouch.length > 0
      ? candidate.artifactsToTouch.map((id) => ({ id, noop: false }))
      : [{ id: `${candidate.id}-TASK-1`, noop: true }];

    const ledgerPath = path.join(process.cwd(), "docs", "arbiter", "_ledger", "prd.events.jsonl");
    await activateEpic(ledgerPath, {
      id: candidate.id,
      tasks
    });

    const memoryQuery = [candidate.title, candidate.intent, scoutSynthesis.summary?.problemStatement]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ") || candidate.id;
    const memoryContext = await queryMemory({ scope: "project", query: memoryQuery, limit: 3 });

    return { status: "PROCEED", scoutSynthesis, memoryContext };
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
