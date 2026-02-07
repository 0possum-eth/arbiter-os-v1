import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

type RuntimeDoctorOptions = {
  rootDir: string;
  commandExists?: (name: string) => boolean;
};

type RuntimeDoctorResult = {
  envReady: boolean;
  missingPrerequisites: string[];
  missingToolchain: string[];
};

const defaultCommandExists = (name: string): boolean => {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [name], { stdio: "ignore" });
  return result.status === 0;
};

const hasPackageJson = async (rootDir: string): Promise<boolean> => {
  try {
    await fs.access(path.join(rootDir, "package.json"));
    return true;
  } catch {
    return false;
  }
};

export const runRuntimeDoctor = async (options: RuntimeDoctorOptions): Promise<RuntimeDoctorResult> => {
  const commandExists = options.commandExists ?? defaultCommandExists;

  const missingPrerequisites: string[] = [];
  if (!commandExists("git")) {
    missingPrerequisites.push("git");
  }
  if (!commandExists("node")) {
    missingPrerequisites.push("node");
  }

  const missingToolchain: string[] = [];
  const packageJsonPresent = await hasPackageJson(options.rootDir);
  if (packageJsonPresent) {
    const hasPackageManager = ["npm", "pnpm", "yarn", "bun"].some((name) => commandExists(name));
    if (!hasPackageManager) {
      missingToolchain.push("package-manager");
    }
  }

  return {
    envReady: missingPrerequisites.length === 0 && missingToolchain.length === 0,
    missingPrerequisites,
    missingToolchain
  };
};

export type { RuntimeDoctorResult, RuntimeDoctorOptions };
