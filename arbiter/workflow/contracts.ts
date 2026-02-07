export const WORKFLOW_PROFILES = ["superpowers_core", "arbiter_core", "hybrid_guided"] as const;

export type WorkflowProfile = (typeof WORKFLOW_PROFILES)[number];

export const ROUTE_DECISION_TYPES = [
  "DIRECT_SUPERPOWERS",
  "DIRECT_ARBITER",
  "PROMPT_FOR_ROUTE"
] as const;

export type RouteDecisionType = (typeof ROUTE_DECISION_TYPES)[number];

export type RouteOption = {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
};

export type RouteDecision = {
  type: RouteDecisionType;
  profile: WorkflowProfile;
  options: RouteOption[];
  recommendedOptionId?: string;
};

const profileSet = new Set<string>(WORKFLOW_PROFILES as readonly string[]);

export const isWorkflowProfile = (value: string): value is WorkflowProfile => profileSet.has(value);

export const createPromptForRouteDecision = (
  profile: WorkflowProfile,
  options: RouteOption[]
): RouteDecision => {
  if (options.length === 0) {
    throw new Error("PROMPT_FOR_ROUTE requires at least one route option");
  }

  const normalized = options.map((option, index) => ({
    ...option,
    recommended: index === 0
  }));

  return {
    type: "PROMPT_FOR_ROUTE",
    profile,
    options: normalized,
    recommendedOptionId: normalized[0].id
  };
};
