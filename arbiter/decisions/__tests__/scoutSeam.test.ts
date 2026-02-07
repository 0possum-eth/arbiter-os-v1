import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

test("actionable scout recommendation activates tasks as non-noop", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-scout-seam-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const payload = {
      schemaVersion: "arbiter.scout.v1",
      metadata: {
        runId: "run-2",
        scoutId: "scout-2",
        generatedAt: "2026-02-05T00:00:00Z",
        confidence: "medium"
      },
      summary: {
        problemStatement: "Implement feature",
        constraints: [],
        unknowns: []
      },
      candidates: [
        {
          id: "EPIC-2",
          title: "Add feature",
          intent: "Ship feature",
          scope: { included: ["src"], excluded: [] },
          prerequisites: [],
          estimatedComplexity: "low",
          artifactsToTouch: ["src/feature.ts"],
          risks: [],
          disallowedActions: []
        }
      ],
      recommendation: {
        candidateId: "EPIC-2",
        rationale: "Only actionable candidate"
      }
    };

    const result = await arbiterDecision(payload);
    assert.equal(result.status, "OK");

    const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
    const prdRaw = await fs.promises.readFile(prdPath, "utf8");
    const prd = JSON.parse(prdRaw) as {
      activeEpicId?: string;
      epics?: Array<{ id?: string; tasks?: Array<{ id?: string; noop?: boolean }> }>;
    };

    assert.equal(prd.activeEpicId, "EPIC-2");
    const activatedEpic = prd.epics?.find((epic) => epic.id === "EPIC-2");
    const activatedTask = activatedEpic?.tasks?.find((task) => task.id === "src/feature.ts");
    assert.equal(activatedTask?.noop, false);
  } finally {
    process.chdir(originalCwd);
  }
});
