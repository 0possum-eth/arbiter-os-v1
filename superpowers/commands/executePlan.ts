import { runEpicAutopilot } from "../../arbiter/run/runEpicAutopilot";

export async function executePlan() {
  return runEpicAutopilot();
}
