import { arbiterDecision } from "../decisions/arbiterDecision";
import { executeEpic } from "../execute/executeEpic";
import { runBrainstorm } from "../phases/brainstorm";
import { runScout } from "../phases/scout";
import { emitReceipt } from "../receipts/emitReceipt";
import type { ReceiptPayload } from "../receipts/types";
import { inspectState } from "../state/inspectState";

type RunEpicResult =
  | { type: "HALT_AND_ASK"; receipt: ReceiptPayload }
  | { type: "IN_PROGRESS" }
  | { type: "FINALIZED" };

export async function runEpicAutopilot(): Promise<RunEpicResult> {
  const state = await inspectState();

  if (state.status === "NO_ACTIVE_EPIC") {
    await runBrainstorm();
    const scoutOutput = await runScout();
    const decision = arbiterDecision(scoutOutput);

    if (decision.status === "HALT_AND_ASK") {
      await emitReceipt(decision.receipt);
      return { type: "HALT_AND_ASK", receipt: decision.receipt };
    }
  }

  while (true) {
    const result = await executeEpic();

    if (result.type === "HALT_AND_ASK") {
      await emitReceipt(result.receipt);
      return { type: "HALT_AND_ASK", receipt: result.receipt };
    }

    if (result.type === "TASK_COMPLETED") {
      return { type: "IN_PROGRESS" };
    }

    if (result.type === "EPIC_COMPLETE") {
      const next = await inspectState();
      if (next.status === "NO_MORE_WORK") {
        await emitReceipt({ type: "RUN_FINALIZED" });
        return { type: "FINALIZED" };
      }
      continue;
    }
  }
}
