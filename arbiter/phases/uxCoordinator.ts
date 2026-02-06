import { emitReceipt } from "../receipts/emitReceipt";
import type { TaskPacket } from "../execute/taskPacket";

export async function runUxCoordinator(taskPacket?: TaskPacket): Promise<void> {
  const taskId = taskPacket?.taskId ?? "RUN_FINALIZATION";
  await emitReceipt({
    type: "UX_SIMULATED",
    taskId,
    packet: {
      taskId,
      passed: true
    }
  });
}
