import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../../docs/indexBricks";
import { runEpicAutopilot } from "../runEpicAutopilot";

const executionRecord = (summary: string) => ({
  command: "node --version",
  exitCode: 0,
  outputSummary: summary,
  outputDigest: createHash("sha256").update(summary, "utf8").digest("hex")
});

const readReceipts = async (receiptsPath: string) => {
  const content = await fs.promises.readFile(receiptsPath, "utf8");
  return content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

const seedVerifierReceipts = async (rootDir: string, runId: string, taskIds: string[]) => {
  const receiptsDir = path.join(rootDir, "docs", "arbiter", "_ledger", "runs", runId);
  await fs.promises.mkdir(receiptsDir, { recursive: true });
  const receiptsPath = path.join(receiptsDir, "receipts.jsonl");

  const entries = taskIds.flatMap((taskId) => [
    {
      receipt: {
        type: "EXECUTOR_COMPLETED",
        taskId,
        packet: {
          taskId,
          execution: [executionRecord("v22.0.0")],
          tests: ["arbiter/run/__tests__/runEpicAutopilot.test.ts"]
        }
      }
    },
    { receipt: { type: "VERIFIER_SPEC", taskId, passed: true, packet: { taskId, passed: true } } },
    {
      receipt: { type: "VERIFIER_QUALITY", taskId, passed: true, packet: { taskId, passed: true } }
    }
  ]);

  await fs.promises.appendFile(
    receiptsPath,
    entries.map((entry) => `${JSON.stringify(entry)}\n`).join(""),
    "utf8"
  );
};

test("runEpicAutopilot completes one task per run", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.chdir(tempDir);
  const runId = "run-e2e";
  process.env.ARBITER_RUN_ID = runId;

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });

    const prdPath = path.join(prdDir, "prd.json");
    const initialState = {
      activeEpicId: "EPIC-1",
      epics: [
        {
          id: "EPIC-1",
          status: "in_progress",
          done: false,
          tasks: [
            {
              id: "TASK-1",
              done: false,
              noop: true
            },
            {
              id: "TASK-2",
              done: false,
              noop: true
            }
          ]
        }
      ]
    };

    await fs.promises.writeFile(prdPath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
    await seedVerifierReceipts(tempDir, runId, ["TASK-1"]);

    const firstRun = await runEpicAutopilot();
    assert.equal(firstRun.type, "IN_PROGRESS");

    const updatedRaw = await fs.promises.readFile(prdPath, "utf8");
    const updatedState = JSON.parse(updatedRaw) as {
      epics?: Array<{ id?: string; done?: boolean; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const updatedEpic = updatedState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(updatedEpic?.done, false);
    assert.equal(updatedEpic?.tasks?.find((task) => task.id === "TASK-1")?.done, true);
    assert.equal(updatedEpic?.tasks?.find((task) => task.id === "TASK-2")?.done, false);

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      runId,
      "receipts.jsonl"
    );
    const receiptsAfterFirst = await readReceipts(receiptsPath);
    const typesAfterFirst = receiptsAfterFirst.map((entry) => entry.receipt.type);
    assert.equal(typesAfterFirst.filter((type) => type === "TASK_COMPLETED").length, 1);
    assert.equal(typesAfterFirst.filter((type) => type === "RUN_FINALIZED").length, 0);
    assert.equal(typesAfterFirst.filter((type) => type === "HALT_AND_ASK").length, 0);

    await seedVerifierReceipts(tempDir, runId, ["TASK-2"]);
    const secondRun = await runEpicAutopilot();
    assert.equal(secondRun.type, "IN_PROGRESS");

    const thirdRun = await runEpicAutopilot();
    assert.equal(thirdRun.type, "FINALIZED");

    const finalRaw = await fs.promises.readFile(prdPath, "utf8");
    const finalState = JSON.parse(finalRaw) as {
      epics?: Array<{ id?: string; done?: boolean; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const finalEpic = finalState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(finalEpic?.done, true);
    assert.equal(finalEpic?.tasks?.find((task) => task.id === "TASK-2")?.done, true);

    const receiptsAfterThird = await readReceipts(receiptsPath);
    const typesAfterThird = receiptsAfterThird.map((entry) => entry.receipt.type);
    assert.equal(typesAfterThird.filter((type) => type === "TASK_COMPLETED").length, 2);
    assert.equal(typesAfterThird.filter((type) => type === "RUN_FINALIZED").length, 1);
    assert.equal(typesAfterThird.filter((type) => type === "HALT_AND_ASK").length, 0);
    const runFinalizedIndex = typesAfterThird.lastIndexOf("RUN_FINALIZED");
    assert.ok(runFinalizedIndex >= 0);
    const integrationIndex = typesAfterThird.indexOf("INTEGRATION_CHECKED");
    const uxIndex = typesAfterThird.indexOf("UX_SIMULATED");
    assert.ok(integrationIndex >= 0);
    assert.ok(uxIndex >= 0);
    assert.ok(integrationIndex < runFinalizedIndex);
    assert.ok(uxIndex < runFinalizedIndex);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});

test("runEpicAutopilot continuous mode finalizes in one run", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-continuous-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  const originalContinuous = process.env.ARBITER_CONTINUOUS;
  process.chdir(tempDir);
  const runId = "run-e2e-continuous";
  process.env.ARBITER_RUN_ID = runId;
  process.env.ARBITER_CONTINUOUS = "true";

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });

    const prdPath = path.join(prdDir, "prd.json");
    const initialState = {
      activeEpicId: "EPIC-1",
      epics: [
        {
          id: "EPIC-1",
          status: "in_progress",
          done: false,
          tasks: [
            {
              id: "TASK-1",
              done: false,
              noop: true
            },
            {
              id: "TASK-2",
              done: false,
              noop: true
            }
          ]
        }
      ]
    };

    await fs.promises.writeFile(prdPath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
    await seedVerifierReceipts(tempDir, runId, ["TASK-1", "TASK-2"]);

    const run = await runEpicAutopilot();
    assert.equal(run.type, "FINALIZED");

    const finalRaw = await fs.promises.readFile(prdPath, "utf8");
    const finalState = JSON.parse(finalRaw) as {
      epics?: Array<{ id?: string; done?: boolean; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const finalEpic = finalState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(finalEpic?.done, true);
    assert.equal(finalEpic?.tasks?.find((task) => task.id === "TASK-1")?.done, true);
    assert.equal(finalEpic?.tasks?.find((task) => task.id === "TASK-2")?.done, true);

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      runId,
      "receipts.jsonl"
    );
    const receipts = await readReceipts(receiptsPath);
    const types = receipts.map((entry) => entry.receipt.type);
    assert.equal(types.filter((type) => type === "TASK_COMPLETED").length, 2);
    assert.equal(types.filter((type) => type === "RUN_FINALIZED").length, 1);
    assert.equal(types.filter((type) => type === "HALT_AND_ASK").length, 0);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    if (originalContinuous === undefined) {
      delete process.env.ARBITER_CONTINUOUS;
    } else {
      process.env.ARBITER_CONTINUOUS = originalContinuous;
    }
  }
});

test("runEpicAutopilot limits non-continuous runs to one actionable bundle", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-bundle-limit-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  const originalIndexPath = process.env.ARBITER_DOCS_INDEX_PATH;
  process.chdir(tempDir);
  const runId = "run-e2e-bundle-limit";
  process.env.ARBITER_RUN_ID = runId;

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });

    const sourceDir = path.join(tempDir, "docs", "sources");
    await fs.promises.mkdir(sourceDir, { recursive: true });
    const strategyDocPath = path.join(sourceDir, "bundle.md");
    await fs.promises.writeFile(
      strategyDocPath,
      "# Bundle\nbundle context for TASK-1 TASK-2 TASK-3 TASK-4 TASK-5",
      "utf8"
    );
    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(sourceDir, indexPath);
    process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

    const prdPath = path.join(prdDir, "prd.json");
    const initialState = {
      activeEpicId: "EPIC-1",
      epics: [
        {
          id: "EPIC-1",
          status: "in_progress",
          done: false,
          tasks: [
            { id: "TASK-1", query: "bundle context", done: false, artifactsToTouch: ["a.txt"] },
            { id: "TASK-2", query: "bundle context", done: false, artifactsToTouch: ["b.txt"] },
            { id: "TASK-3", query: "bundle context", done: false, artifactsToTouch: ["c.txt"] },
            { id: "TASK-4", query: "bundle context", done: false, artifactsToTouch: ["d.txt"] },
            { id: "TASK-5", query: "bundle context", done: false, artifactsToTouch: ["e.txt"] }
          ]
        }
      ]
    };

    await fs.promises.writeFile(prdPath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");

    const run = await runEpicAutopilot();
    assert.equal(run.type, "IN_PROGRESS");

    const updatedRaw = await fs.promises.readFile(prdPath, "utf8");
    const updatedState = JSON.parse(updatedRaw) as {
      epics?: Array<{ id?: string; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const updatedEpic = updatedState.epics?.find((epic) => epic.id === "EPIC-1");
    const doneCount =
      updatedEpic?.tasks?.filter((task) => task.done === true).length ?? 0;
    assert.equal(doneCount, 2);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    if (originalIndexPath === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalIndexPath;
    }
  }
});

test("runEpicAutopilot halts on tasks requiring external input", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-halt-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.chdir(tempDir);
  const runId = "run-e2e-halt";
  process.env.ARBITER_RUN_ID = runId;

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });

    const prdPath = path.join(prdDir, "prd.json");
    const initialState = {
      activeEpicId: "EPIC-1",
      epics: [
        {
          id: "EPIC-1",
          status: "in_progress",
          done: false,
          tasks: [
            {
              id: "TASK-1",
              done: false,
              requiresInput: true,
              requiresInputReason: "MISSING_API_KEY",
              noop: true
            },
            {
              id: "TASK-2",
              done: false,
              noop: true
            }
          ]
        }
      ]
    };

    await fs.promises.writeFile(prdPath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");

    const firstRun = await runEpicAutopilot();
    assert.equal(firstRun.type, "HALT_AND_ASK");
    assert.equal(firstRun.receipt.type, "HALT_AND_ASK");
    assert.equal(firstRun.receipt.reason, "MISSING_API_KEY");

    const unchangedRaw = await fs.promises.readFile(prdPath, "utf8");
    const unchangedState = JSON.parse(unchangedRaw) as {
      epics?: Array<{ id?: string; done?: boolean; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const unchangedEpic = unchangedState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(unchangedEpic?.tasks?.find((task) => task.id === "TASK-1")?.done, false);

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      runId,
      "receipts.jsonl"
    );
    const receiptsAfterFirst = await readReceipts(receiptsPath);
    const typesAfterFirst = receiptsAfterFirst.map((entry) => entry.receipt.type);
    assert.equal(typesAfterFirst.filter((type) => type === "HALT_AND_ASK").length, 1);
    assert.equal(typesAfterFirst.filter((type) => type === "TASK_COMPLETED").length, 0);
    assert.equal(typesAfterFirst.filter((type) => type === "RUN_FINALIZED").length, 0);

    const resumeRaw = JSON.parse(unchangedRaw) as typeof initialState;
    resumeRaw.epics[0].tasks[0].requiresInput = false;
    resumeRaw.epics[0].tasks[0].requiresInputReason = undefined;
    await fs.promises.writeFile(prdPath, `${JSON.stringify(resumeRaw, null, 2)}\n`, "utf8");
    await seedVerifierReceipts(tempDir, runId, ["TASK-1", "TASK-2"]);

    const secondRun = await runEpicAutopilot();
    assert.equal(secondRun.type, "IN_PROGRESS");

    const updatedRaw = await fs.promises.readFile(prdPath, "utf8");
    const updatedState = JSON.parse(updatedRaw) as {
      epics?: Array<{ id?: string; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const updatedEpic = updatedState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(updatedEpic?.tasks?.find((task) => task.id === "TASK-1")?.done, true);
    assert.equal(updatedEpic?.tasks?.find((task) => task.id === "TASK-2")?.done, false);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});

test("runEpicAutopilot advances when non-noop task has executor and verifier flow", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-runner-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  const originalIndexPath = process.env.ARBITER_DOCS_INDEX_PATH;
  process.chdir(tempDir);
  process.env.ARBITER_RUN_ID = "run-e2e-runner";

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });

    const sourceDir = path.join(tempDir, "docs", "sources");
    await fs.promises.mkdir(sourceDir, { recursive: true });
    const strategyDocPath = path.join(sourceDir, "strategy.md");
    await fs.promises.writeFile(strategyDocPath, "# Strategy\nTASK-1 execution notes.", "utf8");
    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(sourceDir, indexPath);
    process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

    const prdPath = path.join(prdDir, "prd.json");
    const initialState = {
      activeEpicId: "EPIC-1",
      epics: [
        {
          id: "EPIC-1",
          status: "in_progress",
          done: false,
          tasks: [
            {
              id: "TASK-1",
              done: false
            }
          ]
        }
      ]
    };

    await fs.promises.writeFile(prdPath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");

    const firstRun = await runEpicAutopilot();
    assert.equal(firstRun.type, "IN_PROGRESS");

    const updatedRaw = await fs.promises.readFile(prdPath, "utf8");
    const updatedState = JSON.parse(updatedRaw) as {
      epics?: Array<{ id?: string; done?: boolean; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const updatedEpic = updatedState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(updatedEpic?.tasks?.find((task) => task.id === "TASK-1")?.done, true);

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      "run-e2e-runner",
      "receipts.jsonl"
    );
    const receipts = await readReceipts(receiptsPath);
    const types = receipts.map((entry) => entry.receipt.type);
    assert.ok(types.includes("EXECUTOR_COMPLETED"));
    assert.ok(types.includes("VERIFIER_SPEC"));
    assert.ok(types.includes("VERIFIER_QUALITY"));
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
    if (originalIndexPath === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalIndexPath;
    }
  }
});

test("runEpicAutopilot completes a noop task", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-noop-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.chdir(tempDir);
  const runId = "run-e2e-noop";
  process.env.ARBITER_RUN_ID = runId;

  try {
    const prdDir = path.join(tempDir, "docs", "arbiter");
    await fs.promises.mkdir(prdDir, { recursive: true });

    const prdPath = path.join(prdDir, "prd.json");
    const initialState = {
      activeEpicId: "EPIC-1",
      epics: [
        {
          id: "EPIC-1",
          status: "in_progress",
          done: false,
          tasks: [
            {
              id: "TASK-1",
              done: false,
              noop: true
            }
          ]
        }
      ]
    };

    await fs.promises.writeFile(prdPath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
    await seedVerifierReceipts(tempDir, runId, ["TASK-1"]);

    const firstRun = await runEpicAutopilot();
    assert.equal(firstRun.type, "IN_PROGRESS");

    const secondRun = await runEpicAutopilot();
    assert.equal(secondRun.type, "FINALIZED");

    const updatedRaw = await fs.promises.readFile(prdPath, "utf8");
    const updatedState = JSON.parse(updatedRaw) as {
      epics?: Array<{ id?: string; done?: boolean; tasks?: Array<{ id?: string; done?: boolean }> }>;
    };
    const updatedEpic = updatedState.epics?.find((epic) => epic.id === "EPIC-1");
    assert.equal(updatedEpic?.tasks?.find((task) => task.id === "TASK-1")?.done, true);

    const receiptsPath = path.join(
      tempDir,
      "docs",
      "arbiter",
      "_ledger",
      "runs",
      runId,
      "receipts.jsonl"
    );
    const receipts = await readReceipts(receiptsPath);
    const types = receipts.map((entry) => entry.receipt.type);
    assert.equal(types.filter((type) => type === "TASK_COMPLETED").length, 1);
    assert.equal(types.filter((type) => type === "RUN_FINALIZED").length, 1);
    assert.equal(types.filter((type) => type === "HALT_AND_ASK").length, 0);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});

test("runEpicAutopilot activates scout tasks as actionable by default", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-e2e-scout-activation-"));
  const originalCwd = process.cwd();
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.chdir(tempDir);
  const runId = "run-e2e-scout-activation";
  process.env.ARBITER_RUN_ID = runId;

  try {
    const run = await runEpicAutopilot();
    assert.equal(run.type, "HALT_AND_ASK");
    assert.equal(run.receipt.type, "HALT_AND_ASK");
    assert.equal(run.receipt.reason, "CONTEXT_PACK_REQUIRED");

    const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
    const prdRaw = await fs.promises.readFile(prdPath, "utf8");
    const prdState = JSON.parse(prdRaw) as {
      activeEpicId?: string;
      epics?: Array<{ id?: string; tasks?: Array<{ id?: string; done?: boolean; noop?: boolean }> }>;
    };
    const activeEpic = prdState.epics?.find((epic) => epic.id === prdState.activeEpicId);
    const firstPendingTask = activeEpic?.tasks?.find((task) => task.done !== true);
    assert.equal(firstPendingTask?.noop, false);
    assert.equal(firstPendingTask?.done, false);
  } finally {
    process.chdir(originalCwd);
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});
