import assert from "node:assert/strict";
import { test } from "node:test";

import { arbiterCommands } from "../index";
import { runEpic } from "../runEpic";
import { approveBrick } from "../approveBrick";
import { mountDoc } from "../mountDoc";
import { listBricks } from "../listBricks";

test("arbiter command surface includes all public commands", () => {
  assert.deepEqual(Object.keys(arbiterCommands).sort(), [
    "approve-brick",
    "list-bricks",
    "mount-doc",
    "run-epic"
  ]);
  assert.equal(arbiterCommands["run-epic"], runEpic);
  assert.equal(arbiterCommands["approve-brick"], approveBrick);
  assert.equal(arbiterCommands["mount-doc"], mountDoc);
  assert.equal(arbiterCommands["list-bricks"], listBricks);
});
