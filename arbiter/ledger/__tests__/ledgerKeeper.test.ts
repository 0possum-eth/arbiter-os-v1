import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { ledgerKeeper } from "../ledgerKeeper";

const executionRecord = (summary: string) => ({
  command: "node --version",
  exitCode: 0,
  outputSummary: summary,
  outputDigest: createHash("sha256").update(summary, "utf8").digest("hex")
});

const seedRunReceipts = async (
  rootDir: string,
  runId: string,
  taskId: string,
  options: { includeIntegration?: boolean; includeUx?: boolean; includeOracle?: boolean } = {}
) => {
  const receiptsDir = path.join(rootDir, "docs", "arbiter", "_ledger", "runs", runId);
  await fs.promises.mkdir(receiptsDir, { recursive: true });
  const receiptsPath = path.join(receiptsDir, "receipts.jsonl");
  const entries = [
    {
      id: "REC-EXECUTOR-1",
      receipt: {
        type: "EXECUTOR_COMPLETED",
        taskId,
        packet: {
          taskId,
          execution: [executionRecord("v22.0.0")],
          tests: ["arbiter/ledger/__tests__/ledgerKeeper.test.ts"],
          files_changed: ["arbiter/ledger/ledgerKeeper.ts", "arbiter/verify/verifyReceipts.ts"]
        }
      }
    },
    {
      id: "REC-SPEC-1",
      receipt: { type: "VERIFIER_SPEC", taskId, passed: true, packet: { taskId, passed: true } }
    },
    {
      id: "REC-QUALITY-1",
      receipt: { type: "VERIFIER_QUALITY", taskId, passed: true, packet: { taskId, passed: true } }
    }
  ];

  if (options.includeIntegration === true) {
    entries.push({
      id: "REC-INTEGRATION-1",
      receipt: { type: "INTEGRATION_CHECKED", taskId, packet: { taskId, passed: true } }
    });
  }

  if (options.includeUx === true) {
    entries.push({
      id: "REC-UX-1",
      receipt: {
        type: "UX_SIMULATED",
        taskId,
        packet: { taskId, passed: true, journey_checks: ["journey:task-flow"] }
      }
    });
  }

  if (options.includeOracle === true) {
    entries.push({
      id: "REC-ORACLE-1",
      receipt: {
        type: "ORACLE_REVIEWED",
        taskId,
        packet: { taskId, passed: true, findings: ["risk:ok"] }
      }
    });
  }
  await fs.promises.writeFile(
    receiptsPath,
    entries.map((entry) => `${JSON.stringify(entry)}\n`).join(""),
    "utf8"
  );
};

const seedLegacyReceipts = async (rootDir: string, lines: string) => {
  const receiptsDir = path.join(rootDir, "docs", "arbiter", "_ledger", "receipts");
  await fs.promises.mkdir(receiptsDir, { recursive: true });
  await fs.promises.writeFile(path.join(receiptsDir, "receipts.jsonl"), lines, "utf8");
};

test("ledgerKeeper writes task_done when receipts are valid", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", tasks: [{ id: "TASK-1" }] }] }),
      "utf8"
    );

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1");
    await seedLegacyReceipts(tempDir, "{not-json}\n");

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
    assert.deepEqual(taskDone?.data?.evidence, {
      executor_receipt_id: "REC-EXECUTOR-1",
      verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
      execution: [executionRecord("v22.0.0")],
      tests: ["arbiter/ledger/__tests__/ledgerKeeper.test.ts"],
      files_changed: ["arbiter/ledger/ledgerKeeper.ts", "arbiter/verify/verifyReceipts.ts"]
    });
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});

test("ledgerKeeper halts when receipt lines are malformed", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-bad-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", tasks: [{ id: "TASK-1" }] }] }),
      "utf8"
    );

    const receiptsDir = path.join(tempDir, "docs", "arbiter", "_ledger", "runs", "RUN-1");
    await fs.promises.mkdir(receiptsDir, { recursive: true });
    await fs.promises.writeFile(path.join(receiptsDir, "receipts.jsonl"), "{not-json}\n", "utf8");

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const result = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(result, { status: "HALT_AND_ASK", reason: "RECEIPTS_INVALID" });
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});

test("ledgerKeeper halts when task is not in selected epic", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-task-mismatch-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", tasks: [{ id: "TASK-2" }] }] }),
      "utf8"
    );

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1");

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const result = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(result, { status: "HALT_AND_ASK", reason: "TASK_NOT_IN_EPIC" });
    assert.equal(fs.existsSync(ledgerPath), false);
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});

test("ledgerKeeper halts when PRD is malformed", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-prd-bad-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(path.join(prdDir, "prd.json"), "{not-json}\n", "utf8");

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1");

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const result = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(result, { status: "HALT_AND_ASK", reason: "PRD_INVALID" });
    assert.equal(fs.existsSync(ledgerPath), false);
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});

test("ledgerKeeper enforces integration receipt for integration-required tasks", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-integration-gate-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({
        activeEpicId: "EPIC-1",
        epics: [
          {
            id: "EPIC-1",
            tasks: [{ id: "TASK-1", requiresIntegrationCheck: true }]
          }
        ]
      }),
      "utf8"
    );

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1");

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const withoutIntegration = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(withoutIntegration, { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" });

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1", { includeIntegration: true });
    const withIntegration = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(withIntegration, { status: "OK" });

    const events = (await fs.promises.readFile(ledgerPath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { op?: string; data?: Record<string, unknown> });
    const taskDone = events.find((event) => event.op === "task_done");
    assert.equal(
      (taskDone?.data?.evidence as { integration_receipt_id?: string } | undefined)?.integration_receipt_id,
      "REC-INTEGRATION-1"
    );
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});

test("ledgerKeeper enforces ux receipt for ux-sensitive tasks", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-ux-gate-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({
        activeEpicId: "EPIC-1",
        epics: [
          {
            id: "EPIC-1",
            tasks: [{ id: "TASK-1", uxSensitive: true }]
          }
        ]
      }),
      "utf8"
    );

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1");

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const withoutUx = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(withoutUx, { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" });

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1", { includeUx: true });
    const withUx = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(withUx, { status: "OK" });

    const events = (await fs.promises.readFile(ledgerPath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { op?: string; data?: Record<string, unknown> });
    const taskDone = events.find((event) => event.op === "task_done");
    assert.equal((taskDone?.data?.evidence as { ux_receipt_id?: string } | undefined)?.ux_receipt_id, "REC-UX-1");
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});

test("ledgerKeeper enforces oracle receipt for oracle-reviewed tasks", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-oracle-gate-"));
  const cwdDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-keeper-cwd-"));
  const original = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-1";
  process.chdir(cwdDir);

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(prdDir, "prd.json"),
      JSON.stringify({
        activeEpicId: "EPIC-1",
        epics: [
          {
            id: "EPIC-1",
            tasks: [{ id: "TASK-1", requiresOracleReview: true }]
          }
        ]
      }),
      "utf8"
    );

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1", { includeIntegration: true, includeUx: true });

    const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
    const withoutOracle = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(withoutOracle, { status: "HALT_AND_ASK", reason: "VERIFICATION_REQUIRED" });

    await seedRunReceipts(tempDir, "RUN-1", "TASK-1", {
      includeIntegration: true,
      includeUx: true,
      includeOracle: true
    });
    const withOracle = await ledgerKeeper(ledgerPath, "EPIC-1", "TASK-1");
    assert.deepEqual(withOracle, { status: "OK" });

    const events = (await fs.promises.readFile(ledgerPath, "utf8"))
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { op?: string; data?: Record<string, unknown> });
    const taskDone = events.find((event) => event.op === "task_done");
    assert.equal(
      (taskDone?.data?.evidence as { oracle_receipt_id?: string } | undefined)?.oracle_receipt_id,
      "REC-ORACLE-1"
    );
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    process.chdir(original);
  }
});
