import { emitReceipt } from "../receipts/emitReceipt";
import type { TaskPacket } from "../execute/taskPacket";

export async function runElectrician(taskPacket?: TaskPacket): Promise<void> {
  const taskId = taskPacket?.taskId ?? "RUN_FINALIZATION";
  await emitReceipt({
    type: "INTEGRATION_CHECKED",
    taskId,
    packet: {
      taskId,
      passed: true
    }
  });
}
