import assert from "node:assert/strict";
import { test } from "node:test";

import { validateScoutSynthesis } from "../validateScoutSynthesis";

const baseEnvelope = () => ({
  schemaVersion: "arbiter.scout.v1",
  metadata: {
    runId: "run-1",
    scoutId: "scout-1",
    generatedAt: "2026-02-05T00:00:00Z",
    confidence: "medium"
  },
  summary: {
    problemStatement: "Define the next epic for the repo",
    constraints: ["No destructive changes"],
    unknowns: ["Primary target runtime"]
  },
  candidates: [
    {
      id: "EPIC-1",
      title: "Bootstrap arbiter loop",
      intent: "Add the base run-epic coordinator",
      scope: {
        included: ["arbiter/"],
        excluded: ["tests/"]
      },
      prerequisites: ["none"],
      estimatedComplexity: "medium",
      artifactsToTouch: ["arbiter/decisions/arbiterDecision.ts"],
      risks: ["Incomplete wiring"],
      disallowedActions: []
    }
  ],
  recommendation: {
    candidateId: "EPIC-1",
    rationale: "Smallest viable step"
  }
});

const expectViolation = (fn: () => void) => {
  assert.throws(fn, (error: unknown) => {
    return typeof error === "object" && error !== null && "type" in error;
  });
};

test("valid envelope passes", () => {
  const envelope = baseEnvelope();
  const result = validateScoutSynthesis(envelope);
  assert.equal(result, envelope);
});

test("recommendation must reference an existing candidate", () => {
  const envelope = baseEnvelope();
  envelope.recommendation.candidateId = "EPIC-2";
  expectViolation(() => validateScoutSynthesis(envelope));
});

test("failureMode cannot be paired with recommendation", () => {
  const envelope = baseEnvelope();
  envelope.failureMode = {
    type: "NO_ACTIONABLE_CANDIDATES",
    reason: "No scope matched"
  };
  expectViolation(() => validateScoutSynthesis(envelope));
});

test("extra fields fail schema validation", () => {
  const envelope = baseEnvelope();
  envelope.extra = "nope";
  expectViolation(() => validateScoutSynthesis(envelope));
});

test("disallowedActions must be empty", () => {
  const envelope = baseEnvelope();
  envelope.candidates[0].disallowedActions = ["execute"];
  expectViolation(() => validateScoutSynthesis(envelope));
});
