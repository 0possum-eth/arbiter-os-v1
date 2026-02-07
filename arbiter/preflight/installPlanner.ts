import type { RuntimeDoctorResult } from "./runtimeDoctor";

type InstallAction = {
  id: string;
  target: string;
  command: string;
};

type InstallPlan = {
  actions: InstallAction[];
};

type BuildInstallPlanOptions = {
  platform?: NodeJS.Platform;
};

const buildCommand = (platform: NodeJS.Platform, target: string): string => {
  if (platform === "win32") {
    if (target === "git") return "winget install --id Git.Git -e --source winget";
    if (target === "node") return "winget install --id OpenJS.NodeJS.LTS -e --source winget";
    if (target === "package-manager") return "npm install -g pnpm";
  }

  if (platform === "darwin") {
    if (target === "git") return "brew install git";
    if (target === "node") return "brew install node";
    if (target === "package-manager") return "npm install -g pnpm";
  }

  if (target === "git") return "sudo apt-get update && sudo apt-get install -y git";
  if (target === "node") return "sudo apt-get update && sudo apt-get install -y nodejs npm";
  return "npm install -g pnpm";
};

export const buildInstallPlan = (
  doctorResult: RuntimeDoctorResult,
  options: BuildInstallPlanOptions = {}
): InstallPlan => {
  const platform = options.platform ?? process.platform;
  const targets = [...doctorResult.missingPrerequisites, ...doctorResult.missingToolchain];

  const actions = targets.map((target) => ({
    id: `install-${target}`,
    target,
    command: buildCommand(platform, target)
  }));

  return { actions };
};

export type { InstallAction, InstallPlan, BuildInstallPlanOptions };
