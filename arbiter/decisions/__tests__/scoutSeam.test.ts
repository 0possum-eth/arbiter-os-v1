import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { arbiterDecision } from "../arbiterDecision";
import { writeMemoryEntry } from "../../memory/store";

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
    await writeMemoryEntry("project", { note: "feature context from prior work" });

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
    assert.equal(result.status, "PROCEED");
    assert.ok((result.memoryContext?.length ?? 0) > 0);

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

test("arbiterDecision prefers execution-ready candidate when recommendation is noop", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-scout-ready-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    const payload = {
      schemaVersion: "arbiter.scout.v1",
      metadata: {
        runId: "run-3",
        scoutId: "scout-3",
        generatedAt: "2026-02-05T00:00:00Z",
        confidence: "medium"
      },
      summary: {
        problemStatement: "Pick actionable work",
        constraints: [],
        unknowns: []
      },
      candidates: [
        {
          id: "EPIC-NOOP",
          title: "Documentation sweep",
          intent: "Review docs",
          scope: { included: ["docs"], excluded: [] },
          prerequisites: [],
          estimatedComplexity: "low",
          artifactsToTouch: [],
          risks: [],
          disallowedActions: []
        },
        {
          id: "EPIC-ACTION",
          title: "Implement feature",
          intent: "Ship executable task",
          scope: { included: ["src"], excluded: [] },
          prerequisites: [],
          estimatedComplexity: "low",
          artifactsToTouch: ["src/work.ts"],
          risks: [],
          disallowedActions: []
        }
      ],
      recommendation: {
        candidateId: "EPIC-NOOP",
        rationale: "Conservative default"
      }
    };

    const result = await arbiterDecision(payload);
    assert.equal(result.status, "PROCEED");
    const synthesis = result.scoutSynthesis as { recommendation?: { rationale?: string } };
    assert.match(synthesis.recommendation?.rationale ?? "", /score=/i);
    assert.match(synthesis.recommendation?.rationale ?? "", /tie=/i);

    const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
    const prdRaw = await fs.promises.readFile(prdPath, "utf8");
    const prd = JSON.parse(prdRaw) as {
      activeEpicId?: string;
      epics?: Array<{ id?: string; tasks?: Array<{ id?: string; noop?: boolean }> }>;
    };

    assert.equal(prd.activeEpicId, "EPIC-ACTION");
    const activatedEpic = prd.epics?.find((epic) => epic.id === "EPIC-ACTION");
    const activatedTask = activatedEpic?.tasks?.find((task) => task.id === "src/work.ts");
    assert.equal(activatedTask?.noop, false);
  } finally {
    process.chdir(originalCwd);
  }
});
