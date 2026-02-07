import assert from "node:assert/strict";
import { test } from "node:test";

import { buildRoutePrompt } from "../routePrompt";

test("buildRoutePrompt returns null when prompting is not required", () => {
  const message = buildRoutePrompt({
    shouldPrompt: false,
    hasOneSentenceGoal: false,
    promptedInRun: false
  });

  assert.equal(message, null);
});

test("buildRoutePrompt emits ambiguous-start prompt when route is unknown", () => {
  const message = buildRoutePrompt({
    shouldPrompt: true,
    hasOneSentenceGoal: false,
    promptedInRun: false
  });

  assert.match(message ?? "", /run-epic needs direction before execution\./);
});

test("buildRoutePrompt emits one-sentence prompt when goal is detected", () => {
  const message = buildRoutePrompt({
    shouldPrompt: true,
    hasOneSentenceGoal: true,
    promptedInRun: false
  });

  assert.match(message ?? "", /I detected a one-sentence goal and can route immediately\./);
});

test("buildRoutePrompt emits explicit bypass text when direct route is selected", () => {
  const message = buildRoutePrompt({
    shouldPrompt: false,
    hasOneSentenceGoal: false,
    explicitRouteBypass: "arbiter_core",
    promptedInRun: false
  });

  assert.equal(message, "Routing directly to arbiter_core because you explicitly requested it.");
});

test("buildRoutePrompt obeys re-prompt guardrail", () => {
  const message = buildRoutePrompt({
    shouldPrompt: true,
    hasOneSentenceGoal: false,
    promptedInRun: true,
    routeFailed: false,
    prerequisitesChanged: false
  });

  assert.equal(message, null);
});
