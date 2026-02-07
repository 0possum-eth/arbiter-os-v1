import { runEpicAutopilot } from "../run/runEpicAutopilot";
import { resolveWorkflowMode } from "../run/workflowMode";

type RunEpicOptions = {
  workflowMode?: string;
};

export async function runEpic(options: RunEpicOptions = {}) {
  return runEpicAutopilot({ workflowMode: resolveWorkflowMode(options.workflowMode) });
}
