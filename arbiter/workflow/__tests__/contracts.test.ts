import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ROUTE_DECISION_TYPES,
  WORKFLOW_PROFILES,
  createPromptForRouteDecision,
  isWorkflowProfile
} from "../contracts";

test("workflow profiles include superpowers_core arbiter_core and hybrid_guided", () => {
  assert.deepEqual(WORKFLOW_PROFILES, ["superpowers_core", "arbiter_core", "hybrid_guided"]);
});

test("isWorkflowProfile accepts valid values and rejects invalid", () => {
  assert.equal(isWorkflowProfile("superpowers_core"), true);
  assert.equal(isWorkflowProfile("arbiter_core"), true);
  assert.equal(isWorkflowProfile("hybrid_guided"), true);
  assert.equal(isWorkflowProfile("receipt_gated"), false);
  assert.equal(isWorkflowProfile(""), false);
});

test("route decision types include direct and prompt variants", () => {
  assert.deepEqual(ROUTE_DECISION_TYPES, ["DIRECT_SUPERPOWERS", "DIRECT_ARBITER", "PROMPT_FOR_ROUTE"]);
});

test("createPromptForRouteDecision requires a recommended option", () => {
  const decision = createPromptForRouteDecision("hybrid_guided", [
    { id: "quick_scout", label: "Quick Scout", description: "Generate a PRD from one sentence" },
    { id: "brainstorm_then_scout", label: "Brainstorm then Scout", description: "Refine intent before synthesis" }
  ]);

  assert.equal(decision.type, "PROMPT_FOR_ROUTE");
  assert.equal(decision.profile, "hybrid_guided");
  assert.equal(decision.recommendedOptionId, "quick_scout");
  assert.equal(decision.options[0].recommended, true);
});
