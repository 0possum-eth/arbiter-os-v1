export const WORKFLOW_MODES = ["receipt_gated", "single_agent", "batch_validation"] as const;

export type WorkflowMode = (typeof WORKFLOW_MODES)[number];

type WorkflowExecutionProfile = {
  mode: WorkflowMode;
  continuousMode: boolean;
  maxBundleSize: number;
};

type ResolveWorkflowExecutionProfileOptions = {
  continuousEnv: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/[-\s]+/g, "_");

const isWorkflowMode = (value: string): value is WorkflowMode =>
  (WORKFLOW_MODES as readonly string[]).includes(value);

const normalizeMode = (value: unknown): WorkflowMode | null => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = normalize(value);
  return isWorkflowMode(normalized) ? normalized : null;
};

export const resolveWorkflowMode = (preferredMode?: string): WorkflowMode => {
  const explicitMode = normalizeMode(preferredMode);
  if (explicitMode) {
    return explicitMode;
  }

  const envMode = normalizeMode(process.env.ARBITER_WORKFLOW_MODE);
  if (envMode) {
    return envMode;
  }

  return "receipt_gated";
};

export const resolveWorkflowExecutionProfile = (
  mode: WorkflowMode,
  options: ResolveWorkflowExecutionProfileOptions
): WorkflowExecutionProfile => {
  if (mode === "single_agent") {
    return {
      mode,
      continuousMode: false,
      maxBundleSize: 1
    };
  }

  if (mode === "batch_validation") {
    return {
      mode,
      continuousMode: true,
      maxBundleSize: 2
    };
  }

  return {
    mode,
    continuousMode: options.continuousEnv,
    maxBundleSize: 2
  };
};

export type { WorkflowExecutionProfile };
