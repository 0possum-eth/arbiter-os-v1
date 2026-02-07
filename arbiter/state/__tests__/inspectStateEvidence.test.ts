import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { inspectState } from "../inspectState";

const writeReceipt = async (rootDir: string, runId: string, receipt: Record<string, unknown>) => {
  const runDir = path.join(rootDir, "docs", "arbiter", "_ledger", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  const receiptsPath = path.join(runDir, "receipts.jsonl");
  await fs.appendFile(receiptsPath, `${JSON.stringify({ ts: new Date().toISOString(), runId, receipt })}\n`, "utf8");
};

test("inspectState marks evidence as missing when no receipt ledger exists", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-inspect-evidence-"));
  const original = process.cwd();
  process.chdir(tempDir);

  try {
    const state = await inspectState();
    assert.equal(state.evidenceHealth.receiptContinuity, "missing");
    assert.equal(state.evidenceHealth.verifierEvidence, "missing");
    assert.equal(state.evidenceHealth.executionEvidence, "missing");
    assert.equal(state.evidenceHealth.canClaimFlawless, false);
  } finally {
    process.chdir(original);
  }
});

test("inspectState marks evidence healthy when executor and verifier receipts exist", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-inspect-evidence-"));
  const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
  await fs.mkdir(path.dirname(prdPath), { recursive: true });
  await fs.writeFile(
    prdPath,
    JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", done: false }] }),
    "utf8"
  );

  await writeReceipt(tempDir, "run-evidence", {
    type: "EXECUTOR_COMPLETED",
    taskId: "TASK-1",
    packet: { taskId: "TASK-1", execution: [{ command: "echo ok", exitCode: 0 }] }
  });
  await writeReceipt(tempDir, "run-evidence", {
    type: "VERIFIER_SPEC",
    taskId: "TASK-1",
    passed: true,
    packet: { taskId: "TASK-1", passed: true }
  });
  await writeReceipt(tempDir, "run-evidence", {
    type: "VERIFIER_QUALITY",
    taskId: "TASK-1",
    passed: true,
    packet: { taskId: "TASK-1", passed: true }
  });

  const original = process.cwd();
  process.chdir(tempDir);

  try {
    const state = await inspectState();
    assert.equal(state.evidenceHealth.receiptContinuity, "healthy");
    assert.equal(state.evidenceHealth.verifierEvidence, "healthy");
    assert.equal(state.evidenceHealth.executionEvidence, "healthy");
    assert.equal(state.evidenceHealth.canClaimFlawless, true);
  } finally {
    process.chdir(original);
  }
});
