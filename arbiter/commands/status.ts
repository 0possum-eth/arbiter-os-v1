import { inspectState } from "../state/inspectState";

export async function arbiterStatus() {
  return inspectState();
}
