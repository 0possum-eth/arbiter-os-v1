import {
  isWorkflowProfile,
  type WorkflowProfile
} from "../workflow/contracts";
import { readWorkflowProfile, writeWorkflowProfile } from "../workflow/modeStore";

type WorkflowModeInput = {
  profile?: string;
};

type WorkflowModeOptions = {
  rootDir?: string;
};

const normalizeProfile = (value: string) => value.trim().toLowerCase().replace(/[-\s]+/g, "_");

const parseProfile = (value: string): WorkflowProfile => {
  const normalized = normalizeProfile(value);
  if (!isWorkflowProfile(normalized)) {
    throw new Error(`Invalid workflow profile: ${value}`);
  }
  return normalized;
};

export async function workflowMode(
  input: WorkflowModeInput = {},
  options: WorkflowModeOptions = {}
): Promise<{ profile: WorkflowProfile }> {
  if (typeof input.profile === "string" && input.profile.trim().length > 0) {
    const profile = parseProfile(input.profile);
    await writeWorkflowProfile(profile, { rootDir: options.rootDir });
    return { profile };
  }

  const profile = await readWorkflowProfile({ rootDir: options.rootDir });
  return { profile };
}
