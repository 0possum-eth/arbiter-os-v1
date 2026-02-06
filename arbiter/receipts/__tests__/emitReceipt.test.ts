import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { emitReceipt } from "../emitReceipt";

test("emitReceipt writes run-scoped receipts and runs ledger", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-receipts-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-123";
  process.chdir(tempDir);

  try {
    await emitReceipt({ type: "RUN_FINALIZED", summary: "done" });

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      "RUN-123",
      "receipts.jsonl"
    );
    assert.ok(fs.existsSync(receiptsPath));
    const receiptsContent = await fs.promises.readFile(receiptsPath, "utf8");
    const receiptLines = receiptsContent.trim().split("\n").filter(Boolean);
    assert.equal(receiptLines.length, 1);
    const receiptEntry = JSON.parse(receiptLines[0]);
    assert.equal(receiptEntry.runId, "RUN-123");
    assert.equal(receiptEntry.receipt.type, "RUN_FINALIZED");

    const runsPath = path.join(tempDir, "docs", "arbiter", "_ledger", "runs.jsonl");
    assert.ok(fs.existsSync(runsPath));
    const runsContent = await fs.promises.readFile(runsPath, "utf8");
    const runLines = runsContent.trim().split("\n").filter(Boolean);
    assert.ok(runLines.length >= 1);
    const runEvents = runLines.map((line) => JSON.parse(line));
    assert.ok(runEvents.some((event) => event.runId === "RUN-123"));
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});
