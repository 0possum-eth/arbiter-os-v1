import assert from "node:assert/strict";
import { test } from "node:test";

import {
  describeScoutCandidateChoice,
  pickBestScoutCandidate,
  scoreScoutCandidateWithBreakdown
} from "../candidateScoring";

test("scoreScoutCandidateWithBreakdown returns deterministic component scores", () => {
  const scored = scoreScoutCandidateWithBreakdown(
    {
      id: "EPIC-2",
      estimatedComplexity: "low",
      artifactsToTouch: ["src/a.ts", "src/b.ts"],
      disallowedActions: []
    },
    "EPIC-1"
  );

  assert.equal(scored.totalScore > 0, true);
  assert.equal(scored.breakdown.taskCountWeight > 0, true);
  assert.equal(scored.breakdown.executionReadinessBonus > 0, true);
});

test("describeScoutCandidateChoice includes score factors and tie-break context", () => {
  const candidates = [
    {
      id: "EPIC-A",
      estimatedComplexity: "medium" as const,
      artifactsToTouch: ["src/a.ts"],
      disallowedActions: []
    },
    {
      id: "EPIC-B",
      estimatedComplexity: "medium" as const,
      artifactsToTouch: ["src/a.ts"],
      disallowedActions: []
    }
  ];
  const chosen = pickBestScoutCandidate(candidates, "EPIC-B");
  assert.ok(chosen);

  const rationale = describeScoutCandidateChoice(candidates, chosen, "EPIC-B");
  assert.match(rationale, /score=/i);
  assert.match(rationale, /reasons=/i);
  assert.match(rationale, /tie=/i);
});
