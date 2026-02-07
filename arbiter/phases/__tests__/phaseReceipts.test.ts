import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runElectrician } from "../electrician";
import { runUxCoordinator } from "../uxCoordinator";

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
            packet?: { taskId?: string; passed?: boolean; journey_checks?: string[] };
          };
        }
    );
};

test("phase helpers emit task-scoped integration and ux receipts", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-phase-receipts-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.chdir(tempDir);
  process.env.ARBITER_RUN_ID = "RUN-PHASES";

  try {
    await runElectrician({ taskId: "TASK-1", query: "q", contextPack: "## Context Pack", citations: [] });
    await runUxCoordinator({ taskId: "TASK-1", query: "q", contextPack: "## Context Pack", citations: [] });

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      "RUN-PHASES",
      "receipts.jsonl"
    );

    const receipts = await readReceipts(receiptsPath);
    const integration = receipts.find((entry) => entry.receipt.type === "INTEGRATION_CHECKED");
    const ux = receipts.find((entry) => entry.receipt.type === "UX_SIMULATED");

    assert.equal(integration?.receipt.taskId, "TASK-1");
    assert.equal(integration?.receipt.packet?.taskId, "TASK-1");
    assert.equal(integration?.receipt.packet?.passed, true);

    assert.equal(ux?.receipt.taskId, "TASK-1");
    assert.equal(ux?.receipt.packet?.taskId, "TASK-1");
    assert.equal(ux?.receipt.packet?.passed, true);
    assert.ok(Array.isArray(ux?.receipt.packet?.journey_checks));
    assert.ok((ux?.receipt.packet?.journey_checks?.length ?? 0) > 0);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});
