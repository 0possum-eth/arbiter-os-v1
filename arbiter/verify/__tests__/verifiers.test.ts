import assert from "node:assert/strict";
import { test } from "node:test";

import { verifySpec } from "../specVerifier";
import { verifyQuality } from "../qualityVerifier";

test("default verifiers require execution evidence", async () => {
  const packet = {
    taskId: "TASK-1",
    query: "q",
    contextPack: "## Context Pack",
    citations: []
  };

  const noEvidence = { taskId: "TASK-1", tests: [], files_changed: [] };
  const specFail = await verifySpec(packet, noEvidence);
  const qualityFail = await verifyQuality(packet, noEvidence);
  assert.equal(specFail.passed, false);
  assert.equal(qualityFail.passed, false);

  const withEvidence = { taskId: "TASK-1", tests: ["simulated:TASK-1"], files_changed: [] };
  const specPass = await verifySpec(packet, withEvidence);
  const qualityPass = await verifyQuality(packet, withEvidence);
  assert.equal(specPass.passed, true);
  assert.equal(qualityPass.passed, true);

  const blankEvidence = {
    taskId: "TASK-1",
    tests: ["", "   "],
    files_changed: ["", "    "]
  };
  const specBlankFail = await verifySpec(packet, blankEvidence);
  const qualityBlankFail = await verifyQuality(packet, blankEvidence);
  assert.equal(specBlankFail.passed, false);
  assert.equal(qualityBlankFail.passed, false);
});
