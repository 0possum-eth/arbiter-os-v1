import fs from "node:fs/promises";
import path from "node:path";

import { isWorkflowProfile, type WorkflowProfile } from "./contracts";

type ModeStoreOptions = {
  rootDir?: string;
};

type ModeConfig = {
  profile?: unknown;
};

const DEFAULT_WORKFLOW_PROFILE: WorkflowProfile = "hybrid_guided";

const resolveModePath = (options: ModeStoreOptions = {}) => {
  const rootDir = options.rootDir ?? process.cwd();
  return path.join(rootDir, "docs", "arbiter", "workflow-profile.json");
};

export const readWorkflowProfile = async (options: ModeStoreOptions = {}): Promise<WorkflowProfile> => {
  const modePath = resolveModePath(options);

  try {
    const raw = await fs.readFile(modePath, "utf8");
    const parsed = JSON.parse(raw) as ModeConfig;
    const profile = typeof parsed.profile === "string" ? parsed.profile : "";
    return isWorkflowProfile(profile) ? profile : DEFAULT_WORKFLOW_PROFILE;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return DEFAULT_WORKFLOW_PROFILE;
    }
    return DEFAULT_WORKFLOW_PROFILE;
  }
};

export const writeWorkflowProfile = async (
  profile: WorkflowProfile,
  options: ModeStoreOptions = {}
): Promise<void> => {
  const modePath = resolveModePath(options);
  await fs.mkdir(path.dirname(modePath), { recursive: true });
  await fs.writeFile(modePath, `${JSON.stringify({ profile }, null, 2)}\n`, "utf8");
};

export { DEFAULT_WORKFLOW_PROFILE };
