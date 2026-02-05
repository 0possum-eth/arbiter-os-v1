import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyReceipts } from "../verifyReceipts";

test("verifyReceipts requires executor + verifiers", () => {
  const ok = verifyReceipts(
    [
      { type: "EXECUTOR_COMPLETED", taskId: "TASK-1" },
      { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true },
      { type: "VERIFIER_QUALITY", taskId: "TASK-1", passed: true }
    ],
    "TASK-1"
  );

  assert.equal(ok, true);
});
