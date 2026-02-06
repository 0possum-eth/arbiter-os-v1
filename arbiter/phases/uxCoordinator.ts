import { emitReceipt } from "../receipts/emitReceipt";

export async function runUxCoordinator(): Promise<void> {
  await emitReceipt({ type: "UX_SIMULATED" });
}
