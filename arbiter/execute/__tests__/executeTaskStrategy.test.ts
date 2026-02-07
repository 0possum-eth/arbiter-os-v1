import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { executeTaskStrategy } from "../executeTaskStrategy";
import type { TaskPacket } from "../taskPacket";

test("executeTaskStrategy uses command-backed evidence by default", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-DEFAULT",
    query: "run default strategy",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] default strategy",
    citations: ["docs/spec.md#Spec"]
  };

  const result = await executeTaskStrategy(packet);

  assert.equal(result.taskId, "TASK-STRATEGY-DEFAULT");
  assert.deepEqual(result.files_changed, ["docs/spec.md"]);
  assert.ok(Array.isArray(result.execution));
  assert.ok((result.execution ?? []).length > 0);
  assert.ok((result.execution ?? []).some((entry) => entry.command.includes("--version")));
  const [firstExecution] = result.execution ?? [];
  assert.equal(firstExecution?.exitCode, 0);
  assert.ok((firstExecution?.outputSummary.length ?? 0) > 0);
  assert.ok((firstExecution?.outputSummary.length ?? 0) <= 200);
  assert.match(firstExecution?.outputDigest ?? "", /^[a-f0-9]{64}$/);
  assert.equal(
    firstExecution?.outputDigest,
    createHash("sha256").update(firstExecution?.outputSummary ?? "", "utf8").digest("hex")
  );
});

test("executeTaskStrategy executes task packet strategy commands", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(process.cwd(), "arbiter-strategy-"));
  const markerPath = path.join(tempDir, "executed.txt");
  const scriptPath = path.join(tempDir, "write-marker.js");
  await fs.promises.writeFile(
    scriptPath,
    "import fs from 'node:fs'; fs.writeFileSync(process.argv[2], 'ok', 'utf8');",
    "utf8"
  );
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-CUSTOM",
    query: "run custom strategy",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] custom strategy",
    citations: ["docs/spec.md#Spec"],
    strategyCommands: [
      {
        command: process.execPath,
        args: [scriptPath, markerPath]
      }
    ]
  };

  try {
    const result = await executeTaskStrategy(packet);
    const markerContents = await fs.promises.readFile(markerPath, "utf8");

    assert.equal(markerContents, "ok");
    assert.ok((result.execution ?? []).some((entry) => entry.command.includes(markerPath)));
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("executeTaskStrategy binds output digest to bounded output summary", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(process.cwd(), "arbiter-strategy-digest-"));
  const scriptPath = path.join(tempDir, "long-output.js");
  await fs.promises.writeFile(scriptPath, "console.log('x'.repeat(260));", "utf8");
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-DIGEST",
    query: "digest strategy",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] digest strategy",
    citations: ["docs/spec.md#Spec"],
    strategyCommands: [
      {
        command: process.execPath,
        args: [scriptPath]
      }
    ]
  };

  try {
    const result = await executeTaskStrategy(packet);
    const [execution] = result.execution ?? [];

    assert.ok(execution);
    assert.ok(execution.outputSummary.length <= 200);
    assert.equal(
      execution.outputDigest,
      createHash("sha256").update(execution.outputSummary, "utf8").digest("hex")
    );
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("executeTaskStrategy rejects disallowed node eval flags", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-UNSAFE",
    query: "unsafe strategy",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] unsafe strategy",
    citations: ["docs/spec.md#Spec"],
    strategyCommands: [{ command: process.execPath, args: ["-e", "console.log('x')"] }]
  };

  await assert.rejects(() => executeTaskStrategy(packet), /Disallowed node strategy flag/i);
});

test("executeTaskStrategy times out hanging commands", async () => {
  const originalTimeout = process.env.ARBITER_STRATEGY_TIMEOUT_MS;
  process.env.ARBITER_STRATEGY_TIMEOUT_MS = "10";
  const tempDir = await fs.promises.mkdtemp(path.join(process.cwd(), "arbiter-strategy-timeout-"));
  const hangingScriptPath = path.join(tempDir, "hang.js");
  await fs.promises.writeFile(
    hangingScriptPath,
    "setInterval(() => {}, 1000)",
    "utf8"
  );
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-TIMEOUT",
    query: "timeout strategy",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] timeout strategy",
    citations: ["docs/spec.md#Spec"],
    strategyCommands: [
      {
        command: process.execPath,
        args: [hangingScriptPath]
      }
    ]
  };

  try {
    await assert.rejects(() => executeTaskStrategy(packet), /Command timed out/i);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    if (originalTimeout === undefined) {
      delete process.env.ARBITER_STRATEGY_TIMEOUT_MS;
    } else {
      process.env.ARBITER_STRATEGY_TIMEOUT_MS = originalTimeout;
    }
  }
});

test("executeTaskStrategy rejects script paths outside workspace", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-OOW",
    query: "outside workspace",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] outside workspace",
    citations: ["docs/spec.md#Spec"],
    strategyCommands: [{ command: process.execPath, args: ["../outside.js"] }]
  };

  await assert.rejects(() => executeTaskStrategy(packet), /within workspace/i);
});
