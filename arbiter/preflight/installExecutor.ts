import type { InstallPlan } from "./installPlanner";
import type { InstallAttemptedReceipt, InstallAttemptedResult } from "../receipts/types";

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

type ExecuteInstallOptions = {
  consentGranted: boolean;
  runner: (command: string) => Promise<CommandResult>;
};

export const executeInstallPlan = async (
  plan: InstallPlan,
  options: ExecuteInstallOptions
): Promise<{ receipt: InstallAttemptedReceipt }> => {
  if (!options.consentGranted) {
    throw new Error("Install execution requires explicit consent");
  }

  const results: InstallAttemptedResult[] = [];
  for (const action of plan.actions) {
    const commandResult = await options.runner(action.command);
    results.push({
      id: action.id,
      target: action.target,
      command: action.command,
      succeeded: commandResult.exitCode === 0,
      exitCode: commandResult.exitCode
    });
  }

  return {
    receipt: {
      type: "INSTALL_ATTEMPTED",
      results
    }
  };
};

export type { ExecuteInstallOptions, CommandResult, InstallAttemptedReceipt };
