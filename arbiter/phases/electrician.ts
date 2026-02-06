import { emitReceipt } from "../receipts/emitReceipt";

export async function runElectrician(): Promise<void> {
  await emitReceipt({ type: "INTEGRATION_CHECKED" });
}
