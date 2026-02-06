import assert from "node:assert/strict";
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
  assert.ok(Array.isArray(result.tests));
  assert.ok((result.tests ?? []).length > 0);
  assert.ok((result.tests ?? []).every((entry) => !entry.startsWith("simulated:")));
  assert.ok((result.tests ?? []).some((entry) => entry.includes("--version")));
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
    assert.ok((result.tests ?? []).some((entry) => entry.includes(markerPath)));
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
