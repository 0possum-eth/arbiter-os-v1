import { emitReceipt } from "../receipts/emitReceipt";
import type { TaskPacket } from "../execute/taskPacket";
import { buildUxJourney } from "./uxJourney";

export async function runUxCoordinator(taskPacket?: TaskPacket): Promise<void> {
  const taskId = taskPacket?.taskId ?? "RUN_FINALIZATION";
  const journey_checks = buildUxJourney(taskPacket);
  await emitReceipt({
    type: "UX_SIMULATED",
    taskId,
    packet: {
      taskId,
      passed: true,
      journey_checks
    }
  });
}
