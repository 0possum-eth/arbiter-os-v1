import type { IntakeState } from "../intake/state";
import {
  createPromptForRouteDecision,
  type RouteDecision,
  type WorkflowProfile
} from "./contracts";

type ExplicitIntent = "run-epic" | "arbiter-status" | "brainstorm" | "write-plan" | "execute-plan";

type RouteWorkflowEntryInput = {
  profile: WorkflowProfile;
  intakeState: IntakeState;
  explicitIntent?: ExplicitIntent;
  hasOneSentenceGoal: boolean;
};

const buildDirectArbiterDecision = (profile: WorkflowProfile): RouteDecision => ({
  type: "DIRECT_ARBITER",
  profile,
  options: []
});

const buildDirectSuperpowersDecision = (profile: WorkflowProfile): RouteDecision => ({
  type: "DIRECT_SUPERPOWERS",
  profile,
  options: []
});

const buildPromptDecision = (profile: WorkflowProfile): RouteDecision =>
  createPromptForRouteDecision(profile, [
    {
      id: "quick_scout",
      label: "Quick Scout",
      description: "Generate a scoped starter PRD from one sentence"
    },
    {
      id: "brainstorm_then_scout",
      label: "Brainstorm then Scout",
      description: "Clarify intent before scout synthesis"
    },
    {
      id: "use_existing_docs",
      label: "Use existing docs",
      description: "Ingest or mount existing reference documents"
    },
    {
      id: "use_existing_plan",
      label: "Use existing plan",
      description: "Continue from an existing implementation plan"
    }
  ]);

export const routeWorkflowEntry = (input: RouteWorkflowEntryInput): RouteDecision => {
  if (input.explicitIntent === "run-epic" || input.explicitIntent === "arbiter-status") {
    return buildDirectArbiterDecision(input.profile);
  }

  if (
    input.explicitIntent === "brainstorm" ||
    input.explicitIntent === "write-plan" ||
    input.explicitIntent === "execute-plan"
  ) {
    return buildDirectSuperpowersDecision(input.profile);
  }

  if (input.profile === "superpowers_core") {
    return buildDirectSuperpowersDecision(input.profile);
  }

  if (input.profile === "arbiter_core") {
    return buildDirectArbiterDecision(input.profile);
  }

  if (input.intakeState === "EXECUTION_READY" || input.intakeState === "PLAN_READY") {
    return buildDirectArbiterDecision(input.profile);
  }

  return buildPromptDecision(input.profile);
};

export type { RouteWorkflowEntryInput, ExplicitIntent };
