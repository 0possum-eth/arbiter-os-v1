import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyReceipts } from "../verifyReceipts";

test("verifyReceipts requires executor + verifiers", () => {
  const ok = verifyReceipts(
    [
      { id: "REC-EXECUTOR-1", receipt: { type: "EXECUTOR_COMPLETED", taskId: "TASK-1" } },
      { id: "REC-SPEC-1", receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true } },
      { id: "REC-QUALITY-1", receipt: { type: "VERIFIER_QUALITY", taskId: "TASK-1", passed: true } }
    ],
    "TASK-1"
  );

  assert.deepEqual(ok, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"]
  });
});

test("verifyReceipts uses latest relevant receipts for task", () => {
  const ok = verifyReceipts(
    [
      { id: "REC-EXECUTOR-OLD", receipt: { type: "EXECUTOR_COMPLETED", taskId: "TASK-1" } },
      { id: "REC-SPEC-OLD", receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true } },
      {
        id: "REC-QUALITY-OLD",
        receipt: { type: "VERIFIER_QUALITY", taskId: "TASK-1", passed: true }
      },
      {
        id: "REC-EXECUTOR-OTHER",
        receipt: { type: "EXECUTOR_COMPLETED", taskId: "TASK-2", tests: ["should-not-use"] }
      },
      {
        id: "REC-SPEC-FAILED",
        receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: false }
      },
      {
        id: "REC-QUALITY-FAILED",
        receipt: { type: "VERIFIER_QUALITY", taskId: "TASK-1", passed: false }
      },
      {
        id: "REC-EXECUTOR-NEW",
        receipt: { type: "EXECUTOR_COMPLETED", taskId: "TASK-1", tests: ["latest-test"] }
      },
      { id: "REC-SPEC-NEW", receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true } },
      {
        id: "REC-QUALITY-NEW",
        receipt: { type: "VERIFIER_QUALITY", taskId: "TASK-1", passed: true }
      }
    ],
    "TASK-1"
  );

  assert.deepEqual(ok, {
    executor_receipt_id: "REC-EXECUTOR-NEW",
    verifier_receipt_ids: ["REC-SPEC-NEW", "REC-QUALITY-NEW"],
    tests: ["latest-test"]
  });
});
