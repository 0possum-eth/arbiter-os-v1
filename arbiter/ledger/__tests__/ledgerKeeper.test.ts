import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { ledgerKeeper } from "../ledgerKeeper";

const seedReceipts = async (rootDir: string, taskId: string) => {
  const receiptsDir = path.join(rootDir, "docs", "arbiter", "_ledger", "receipts");
  await fs.promises.mkdir(receiptsDir, { recursive: true });
  const receiptsPath = path.join(receiptsDir, "receipts.jsonl");
  const entries = [
    { id: "REC-EXECUTOR-1", receipt: { type: "EXECUTOR_COMPLETED", taskId } },
    { id: "REC-SPEC-1", receipt: { type: "VERIFIER_SPEC", taskId, passed: true } },
    { id: "REC-QUALITY-1", receipt: { type: "VERIFIER_QUALITY", taskId, passed: true } }
  ];
  await fs.promises.writeFile(
    receiptsPath,
    entries.map((entry) => `${JSON.stringify(entry)}\n`).join(""),
    "utf8"
  );
};

test("ledgerKeeper writes task_done when receipts are valid", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", tasks: [{ id: "TASK-1" }] }] }),
      "utf8"
    );

    await seedReceipts(tempDir, "TASK-1");

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const result = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.equal(result.status, "OK");

    const content = await fs.promises.readFile(ledgerPath, "utf8");
    assert.ok(content.includes("task_done"));

    const events = content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { op?: string; id?: string; data?: Record<string, unknown> });
    const taskDone = events.find((event) => event.op === "task_done" && event.id === "TASK-1");
    assert.deepEqual(taskDone?.data?.evidence, ["REC-EXECUTOR-1", "REC-SPEC-1", "REC-QUALITY-1"]);
  } finally {
    process.chdir(original);
  }
});

test("ledgerKeeper halts when receipt lines are malformed", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-bad-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", tasks: [{ id: "TASK-1" }] }] }),
      "utf8"
    );

    const receiptsDir = path.join(tempDir, "docs", "arbiter", "_ledger", "receipts");
    await fs.promises.mkdir(receiptsDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(receiptsDir, "receipts.jsonl"),
      "{not-json}\n",
      "utf8"
    );

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const result = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(result, { status: "HALT_AND_ASK", reason: "RECEIPTS_INVALID" });
  } finally {
    process.chdir(original);
  }
});
