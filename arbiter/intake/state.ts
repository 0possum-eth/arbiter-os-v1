export const INTAKE_STATES = [
  "ENV_NOT_READY",
  "WORKSPACE_NOT_INITIALIZED",
  "REQUIREMENTS_MISSING",
  "PLAN_READY",
  "EXECUTION_READY"
] as const;

export type IntakeState = (typeof INTAKE_STATES)[number];

type ClassifyIntakeStateInput = {
  envReady: boolean;
  workspaceInitialized: boolean;
  hasRequirements: boolean;
  hasPlan: boolean;
  hasActiveEpic: boolean;
};

export const classifyIntakeState = (input: ClassifyIntakeStateInput): IntakeState => {
  if (!input.envReady) {
    return "ENV_NOT_READY";
  }

  if (!input.workspaceInitialized) {
    return "WORKSPACE_NOT_INITIALIZED";
  }

  if (input.hasActiveEpic) {
    return "EXECUTION_READY";
  }

  if (input.hasPlan) {
    return "PLAN_READY";
  }

  if (!input.hasRequirements) {
    return "REQUIREMENTS_MISSING";
  }

  return "EXECUTION_READY";
};

export type { ClassifyIntakeStateInput };
