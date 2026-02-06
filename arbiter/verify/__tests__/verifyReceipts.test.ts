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

  assert.deepEqual(ok, ["REC-EXECUTOR-1", "REC-SPEC-1", "REC-QUALITY-1"]);
});
