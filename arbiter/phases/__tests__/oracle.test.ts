import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runOracle } from "../oracle";

const readReceipts = async (filePath: string) => {
  const raw = await fs.promises.readFile(filePath, "utf8");
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(
      (line) =>
        JSON.parse(line) as {
          receipt: {
            type: string;
            taskId?: string;
            packet?: { taskId?: string; passed?: boolean; findings?: string[] };
          };
        }
    );
};

test("runOracle emits task-scoped oracle review receipt", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-oracle-receipts-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.chdir(tempDir);
  process.env.ARBITER_RUN_ID = "RUN-ORACLE";

  try {
    await runOracle({
      taskId: "TASK-ORACLE",
      query: "validate high risk change",
      contextPack: "## Context Pack\n- [docs/spec.md#Risk] details",
      citations: ["docs/spec.md#Risk"]
    });

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      "RUN-ORACLE",
      "receipts.jsonl"
    );

    const receipts = await readReceipts(receiptsPath);
    const oracle = receipts.find((entry) => entry.receipt.type === "ORACLE_REVIEWED");

    assert.equal(oracle?.receipt.taskId, "TASK-ORACLE");
    assert.equal(oracle?.receipt.packet?.taskId, "TASK-ORACLE");
    assert.equal(oracle?.receipt.packet?.passed, true);
    assert.ok(Array.isArray(oracle?.receipt.packet?.findings));
    assert.ok((oracle?.receipt.packet?.findings?.length ?? 0) > 0);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});
