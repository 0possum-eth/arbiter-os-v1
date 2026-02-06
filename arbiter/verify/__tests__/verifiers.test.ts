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

  const withEvidence = {
    taskId: "TASK-1",
    tests: ["executed:node --version: v22.0.0"],
    files_changed: ["arbiter/verify/specVerifier.ts"]
  };
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

test("default verifiers reject forged or malformed evidence entries", async () => {
  const packet = {
    taskId: "TASK-1",
    query: "q",
    contextPack: "## Context Pack",
    citations: []
  };

  const forgedCommandEvidence = {
    taskId: "TASK-1",
    tests: ["simulated:TASK-1"],
    files_changed: ["arbiter/verify/specVerifier.ts"]
  };
  const specForgedFail = await verifySpec(packet, forgedCommandEvidence);
  const qualityForgedFail = await verifyQuality(packet, forgedCommandEvidence);
  assert.equal(specForgedFail.passed, false);
  assert.equal(qualityForgedFail.passed, false);

  const malformedFileEvidence = {
    taskId: "TASK-1",
    tests: ["executed:node --version: v22.0.0"],
    files_changed: ["specVerifier"]
  };
  const specMalformedFail = await verifySpec(packet, malformedFileEvidence);
  const qualityMalformedFail = await verifyQuality(packet, malformedFileEvidence);
  assert.equal(specMalformedFail.passed, false);
  assert.equal(qualityMalformedFail.passed, false);

  const whitespacePaddedEvidence = {
    taskId: "TASK-1",
    tests: ["  executed:node --version: v22.0.0  "],
    files_changed: ["  arbiter/verify/specVerifier.ts  "]
  };
  const specWhitespacePass = await verifySpec(packet, whitespacePaddedEvidence);
  const qualityWhitespacePass = await verifyQuality(packet, whitespacePaddedEvidence);
  assert.equal(specWhitespacePass.passed, true);
  assert.equal(qualityWhitespacePass.passed, true);
});
