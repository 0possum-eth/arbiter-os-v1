import assert from "node:assert/strict";
import { test } from "node:test";

import type { TaskPacket } from "../taskPacket";
import { runTask } from "../taskRunner";

test("runTask executes non-noop task and emits executor plus verifier receipts", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-3",
    query: "ship task",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] ship task",
    citations: ["docs/spec.md#Spec"]
  };
  const completionPacket = {
    taskId: "TASK-3",
    tests: ["arbiter/execute/__tests__/taskRunner.test.ts"],
    files_changed: ["arbiter/execute/taskRunner.ts"]
  };
  const emitted: Array<Record<string, unknown>> = [];

  const result = await runTask(
    { id: "TASK-3", query: "ship task" },
    {
      buildTaskPacket: async () => packet,
      executeTaskStrategy: async (builtPacket) => {
        assert.equal(builtPacket, packet);
        return completionPacket;
      },
      verifySpec: async (builtPacket, taskCompletionPacket) => {
        assert.equal(builtPacket, packet);
        assert.equal(taskCompletionPacket, completionPacket);
        return { taskId: "TASK-3", passed: true };
      },
      verifyQuality: async (builtPacket, taskCompletionPacket) => {
        assert.equal(builtPacket, packet);
        assert.equal(taskCompletionPacket, completionPacket);
        return { taskId: "TASK-3", passed: true };
      },
      emitReceipt: async (receipt) => {
        emitted.push(receipt as Record<string, unknown>);
      }
    }
  );

  assert.deepEqual(result, { type: "TASK_DONE" });
  assert.deepEqual(emitted, [
    {
      type: "EXECUTOR_COMPLETED",
      taskId: "TASK-3",
      packet: completionPacket
    },
    {
      type: "VERIFIER_SPEC",
      taskId: "TASK-3",
      passed: true,
      packet: { taskId: "TASK-3", passed: true }
    },
    {
      type: "VERIFIER_QUALITY",
      taskId: "TASK-3",
      passed: true,
      packet: { taskId: "TASK-3", passed: true }
    }
  ]);
});

test("runTask halts when spec verifier fails", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-FAIL",
    query: "ship task",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] ship task",
    citations: ["docs/spec.md#Spec"]
  };
  const completionPacket = {
    taskId: "TASK-FAIL",
    tests: ["arbiter/execute/__tests__/taskRunner.test.ts"],
    files_changed: ["arbiter/execute/taskRunner.ts"]
  };
  const emitted: Array<Record<string, unknown>> = [];

  const result = await runTask(
    { id: "TASK-FAIL", query: "ship task" },
    {
      buildTaskPacket: async () => packet,
      executeTaskStrategy: async () => completionPacket,
      verifySpec: async () => ({ taskId: "TASK-FAIL", passed: false }),
      verifyQuality: async () => ({ taskId: "TASK-FAIL", passed: true }),
      emitReceipt: async (receipt) => {
        emitted.push(receipt as Record<string, unknown>);
      }
    }
  );

  assert.deepEqual(result, {
    type: "HALT_AND_ASK",
    reason: "SPEC_VERIFICATION_FAILED"
  });
  assert.deepEqual(emitted, [
    {
      type: "EXECUTOR_COMPLETED",
      taskId: "TASK-FAIL",
      packet: completionPacket
    },
    {
      type: "VERIFIER_SPEC",
      taskId: "TASK-FAIL",
      passed: false,
      packet: { taskId: "TASK-FAIL", passed: false }
    }
  ]);
});

test("runTask halts when verifier packet taskId does not match", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-MISMATCH",
    query: "ship task",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] ship task",
    citations: ["docs/spec.md#Spec"]
  };
  const completionPacket = {
    taskId: "TASK-MISMATCH",
    tests: ["arbiter/execute/__tests__/taskRunner.test.ts"],
    files_changed: ["arbiter/execute/taskRunner.ts"]
  };

  const result = await runTask(
    { id: "TASK-MISMATCH", query: "ship task" },
    {
      buildTaskPacket: async () => packet,
      executeTaskStrategy: async () => completionPacket,
      verifySpec: async () => ({ taskId: "TASK-OTHER", passed: true }),
      verifyQuality: async () => ({ taskId: "TASK-MISMATCH", passed: true }),
      emitReceipt: async () => {}
    }
  );

  assert.deepEqual(result, {
    type: "HALT_AND_ASK",
    reason: "SPEC_VERIFICATION_FAILED"
  });
});

test("runTask halts when quality verifier fails", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-QUALITY-FAIL",
    query: "ship task",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] ship task",
    citations: ["docs/spec.md#Spec"]
  };
  const completionPacket = {
    taskId: "TASK-QUALITY-FAIL",
    tests: ["arbiter/execute/__tests__/taskRunner.test.ts"],
    files_changed: ["arbiter/execute/taskRunner.ts"]
  };
  const emitted: Array<Record<string, unknown>> = [];

  const result = await runTask(
    { id: "TASK-QUALITY-FAIL", query: "ship task" },
    {
      buildTaskPacket: async () => packet,
      executeTaskStrategy: async () => completionPacket,
      verifySpec: async () => ({ taskId: "TASK-QUALITY-FAIL", passed: true }),
      verifyQuality: async () => ({ taskId: "TASK-QUALITY-FAIL", passed: false }),
      emitReceipt: async (receipt) => {
        emitted.push(receipt as Record<string, unknown>);
      }
    }
  );

  assert.deepEqual(result, {
    type: "HALT_AND_ASK",
    reason: "QUALITY_VERIFICATION_FAILED"
  });
  assert.deepEqual(emitted, [
    {
      type: "EXECUTOR_COMPLETED",
      taskId: "TASK-QUALITY-FAIL",
      packet: completionPacket
    },
    {
      type: "VERIFIER_SPEC",
      taskId: "TASK-QUALITY-FAIL",
      passed: true,
      packet: { taskId: "TASK-QUALITY-FAIL", passed: true }
    },
    {
      type: "VERIFIER_QUALITY",
      taskId: "TASK-QUALITY-FAIL",
      passed: false,
      packet: { taskId: "TASK-QUALITY-FAIL", passed: false }
    }
  ]);
});

test("runTask emits integration and ux receipts when task gates are enabled", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-GATED",
    query: "ship gated task",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] ship gated task",
    citations: ["docs/spec.md#Spec"]
  };
  const completionPacket = {
    taskId: "TASK-GATED",
    tests: ["arbiter/execute/__tests__/taskRunner.test.ts"],
    files_changed: ["arbiter/execute/taskRunner.ts"]
  };
  const emitted: Array<Record<string, unknown>> = [];

  const result = await runTask(
    {
      id: "TASK-GATED",
      query: "ship gated task",
      requiresIntegrationCheck: true,
      uxSensitive: true
    },
    {
      buildTaskPacket: async () => packet,
      executeTaskStrategy: async () => completionPacket,
      verifySpec: async () => ({ taskId: "TASK-GATED", passed: true }),
      verifyQuality: async () => ({ taskId: "TASK-GATED", passed: true }),
      runElectrician: async (builtPacket) => {
        assert.equal(builtPacket, packet);
        emitted.push({
          type: "INTEGRATION_CHECKED",
          taskId: packet.taskId,
          packet: { taskId: packet.taskId, passed: true }
        });
      },
      runUxCoordinator: async (builtPacket) => {
        assert.equal(builtPacket, packet);
        emitted.push({
          type: "UX_SIMULATED",
          taskId: packet.taskId,
          packet: { taskId: packet.taskId, passed: true, journey_checks: ["journey:task-flow"] }
        });
      },
      emitReceipt: async (receipt) => {
        emitted.push(receipt as Record<string, unknown>);
      }
    }
  );

  assert.deepEqual(result, { type: "TASK_DONE" });
  assert.deepEqual(emitted, [
    {
      type: "EXECUTOR_COMPLETED",
      taskId: "TASK-GATED",
      packet: completionPacket
    },
    {
      type: "VERIFIER_SPEC",
      taskId: "TASK-GATED",
      passed: true,
      packet: { taskId: "TASK-GATED", passed: true }
    },
    {
      type: "VERIFIER_QUALITY",
      taskId: "TASK-GATED",
      passed: true,
      packet: { taskId: "TASK-GATED", passed: true }
    },
    {
      type: "INTEGRATION_CHECKED",
      taskId: "TASK-GATED",
      packet: { taskId: "TASK-GATED", passed: true }
    },
    {
      type: "UX_SIMULATED",
      taskId: "TASK-GATED",
      packet: { taskId: "TASK-GATED", passed: true, journey_checks: ["journey:task-flow"] }
    }
  ]);
});

test("runTask halts when strategy execution throws", async () => {
  const packet: TaskPacket = {
    taskId: "TASK-STRATEGY-ERROR",
    query: "ship task",
    contextPack: "## Context Pack\n- [docs/spec.md#Spec] ship task",
    citations: ["docs/spec.md#Spec"]
  };

  const result = await runTask(
    { id: "TASK-STRATEGY-ERROR", query: "ship task" },
    {
      buildTaskPacket: async () => packet,
      executeTaskStrategy: async () => {
        throw new Error("strategy failed");
      },
      verifySpec: async () => ({ taskId: "TASK-STRATEGY-ERROR", passed: true }),
      verifyQuality: async () => ({ taskId: "TASK-STRATEGY-ERROR", passed: true }),
      emitReceipt: async () => {}
    }
  );

  assert.equal(result.type, "HALT_AND_ASK");
  assert.match(result.reason, /^TASK_STRATEGY_FAILED:/);
});
