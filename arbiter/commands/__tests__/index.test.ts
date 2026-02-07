import assert from "node:assert/strict";
import { test } from "node:test";

import { arbiterCommands } from "../index";
import { runEpic } from "../runEpic";
import { approveBrick } from "../approveBrick";
import { mountDoc } from "../mountDoc";
import { listBricks } from "../listBricks";
import { arbiterStatus } from "../status";
import { workflowMode } from "../workflowMode";

test("arbiter command surface includes all public commands", () => {
  assert.deepEqual(Object.keys(arbiterCommands).sort(), [
    "approve-brick",
    "arbiter-status",
    "list-bricks",
    "mount-doc",
    "run-epic",
    "workflow-mode"
  ]);
  assert.equal(arbiterCommands["arbiter-status"], arbiterStatus);
  assert.equal(arbiterCommands["run-epic"], runEpic);
  assert.equal(arbiterCommands["approve-brick"], approveBrick);
  assert.equal(arbiterCommands["mount-doc"], mountDoc);
  assert.equal(arbiterCommands["list-bricks"], listBricks);
  assert.equal(arbiterCommands["workflow-mode"], workflowMode);
});
