import assert from "node:assert/strict";
import { test } from "node:test";

import { routeWorkflowEntry } from "../router";

test("routeWorkflowEntry routes explicit run-epic intent directly to arbiter", () => {
  const decision = routeWorkflowEntry({
    profile: "hybrid_guided",
    intakeState: "EXECUTION_READY",
    explicitIntent: "run-epic",
    hasOneSentenceGoal: false
  });

  assert.equal(decision.type, "DIRECT_ARBITER");
});

test("routeWorkflowEntry routes explicit brainstorm intent directly to superpowers", () => {
  const decision = routeWorkflowEntry({
    profile: "hybrid_guided",
    intakeState: "REQUIREMENTS_MISSING",
    explicitIntent: "brainstorm",
    hasOneSentenceGoal: true
  });

  assert.equal(decision.type, "DIRECT_SUPERPOWERS");
});

test("routeWorkflowEntry prompts with recommended quick scout for one sentence goal", () => {
  const decision = routeWorkflowEntry({
    profile: "hybrid_guided",
    intakeState: "REQUIREMENTS_MISSING",
    hasOneSentenceGoal: true
  });

  assert.equal(decision.type, "PROMPT_FOR_ROUTE");
  assert.equal(decision.recommendedOptionId, "quick_scout");
  assert.equal(decision.options[0].id, "quick_scout");
  assert.equal(decision.options[0].recommended, true);
});

test("routeWorkflowEntry prompts route options for ambiguous empty start", () => {
  const decision = routeWorkflowEntry({
    profile: "hybrid_guided",
    intakeState: "REQUIREMENTS_MISSING",
    hasOneSentenceGoal: false
  });

  assert.equal(decision.type, "PROMPT_FOR_ROUTE");
  assert.equal(decision.options.length, 4);
});
