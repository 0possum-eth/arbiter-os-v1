import assert from "node:assert/strict";
import { test } from "node:test";

import { createHaltAndAskReceipt } from "../types";

test("createHaltAndAskReceipt sets recommended option metadata", () => {
  const receipt = createHaltAndAskReceipt({
    reason: "REQUIREMENTS_MISSING",
    options: [
      { id: "quick_scout", label: "Quick Scout", description: "Create PRD from one sentence" },
      { id: "brainstorm_then_scout", label: "Brainstorm then Scout", description: "Refine before scout" }
    ]
  });

  assert.equal(receipt.type, "HALT_AND_ASK");
  assert.equal(receipt.recommendedOptionId, "quick_scout");
  assert.equal(receipt.options?.[0].recommended, true);
});

test("createHaltAndAskReceipt preserves task and epic ids", () => {
  const receipt = createHaltAndAskReceipt({
    reason: "WAITING_FOR_APPROVAL",
    epicId: "EPIC-9",
    taskId: "TASK-2",
    options: [{ id: "continue", label: "Continue", description: "Proceed" }]
  });

  assert.equal(receipt.epicId, "EPIC-9");
  assert.equal(receipt.taskId, "TASK-2");
});
