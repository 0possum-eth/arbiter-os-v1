import assert from "node:assert/strict";
import { test } from "node:test";

import { arbiterDecision } from "../arbiterDecision";

test("invalid scout payload halts with contract violation receipt", async () => {
  const invalidPayload = {
    schemaVersion: "arbiter.scout.v1",
    metadata: {
      runId: "run-1",
      scoutId: "scout-1",
      generatedAt: "2026-02-05T00:00:00Z",
      confidence: "low"
    },
    summary: {
      problemStatement: "Need a plan",
      constraints: [],
      unknowns: []
    },
    candidates: [],
    recommendation: {
      candidateId: "EPIC-1",
      rationale: "Best next"
    },
    failureMode: {
      type: "NO_ACTIONABLE_CANDIDATES",
      reason: "None found"
    }
  };

  const result = await arbiterDecision(invalidPayload);
  assert.equal(result.status, "HALT_AND_ASK");
  assert.equal(result.receipt.type, "SCOUT_CONTRACT_VIOLATION");
  assert.ok(result.receipt.errors.length > 0);
});
