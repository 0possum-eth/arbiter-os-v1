import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyReceipts } from "../verifyReceipts";

const validTaskPackets = (taskId: string) => [
  {
    id: "REC-EXECUTOR-1",
    receipt: {
      type: "EXECUTOR_COMPLETED",
      taskId,
      packet: {
        taskId,
        tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
        files_changed: ["arbiter/verify/verifyReceipts.ts"]
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

test("verifyReceipts requires executor + verifiers", () => {
  const ok = verifyReceipts(validTaskPackets("TASK-1"), "TASK-1");

  assert.deepEqual(ok, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts uses latest relevant receipts for task", () => {
  const ok = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-OLD",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            tests: ["old-test"],
            files_changed: ["old-file.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-OLD",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-OLD",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-EXECUTOR-OTHER",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-2",
          packet: { taskId: "TASK-2", tests: ["should-not-use"], files_changed: ["other.ts"] }
        }
      },
      {
        id: "REC-SPEC-FAILED",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: false,
          packet: { taskId: "TASK-1", passed: false }
        }
      },
      {
        id: "REC-QUALITY-FAILED",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: false,
          packet: { taskId: "TASK-1", passed: false }
        }
      },
      {
        id: "REC-EXECUTOR-NEW",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            tests: ["latest-test"],
            files_changed: ["arbiter/verify/verifyReceipts.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-NEW",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-NEW",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.deepEqual(ok, {
    executor_receipt_id: "REC-EXECUTOR-NEW",
    verifier_receipt_ids: ["REC-SPEC-NEW", "REC-QUALITY-NEW"],
    tests: ["latest-test"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts rejects missing executor packet", () => {
  const result = verifyReceipts(
    [
      { id: "REC-EXECUTOR-1", receipt: { type: "EXECUTOR_COMPLETED", taskId: "TASK-1" } },
      {
        id: "REC-SPEC-1",
        receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true, packet: { taskId: "TASK-1", passed: true } }
      },
      {
        id: "REC-QUALITY-1",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts skips invalid latest verifier packet and keeps valid packet", () => {
  const result = verifyReceipts(
    [
      ...validTaskPackets("TASK-1"),
      {
        id: "REC-SPEC-2",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-OTHER", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.deepEqual(result, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts enforces integration and ux packets for task gates", () => {
  const withoutTaskGates = verifyReceipts(validTaskPackets("TASK-1"), "TASK-1", {
    requiresIntegrationCheck: true,
    uxSensitive: true
  });
  assert.equal(withoutTaskGates, null);

  const withTaskGates = verifyReceipts(
    [
      ...validTaskPackets("TASK-1"),
      {
        id: "REC-INTEGRATION-1",
        receipt: {
          type: "INTEGRATION_CHECKED",
          taskId: "TASK-1",
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-UX-1",
        receipt: {
          type: "UX_SIMULATED",
          taskId: "TASK-1",
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1",
    { requiresIntegrationCheck: true, uxSensitive: true }
  );

  assert.deepEqual(withTaskGates, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    integration_receipt_id: "REC-INTEGRATION-1",
    ux_receipt_id: "REC-UX-1",
    tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts requires verifier packets after latest executor receipt", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-OLD",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            tests: ["old"],
            files_changed: ["old.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-OLD",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-OLD",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-EXECUTOR-NEW",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            tests: ["new"],
            files_changed: ["new.ts"]
          }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});
