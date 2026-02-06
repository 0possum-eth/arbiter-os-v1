import assert from "node:assert/strict";
import { test } from "node:test";

import { bundleTasks } from "../bundleStrategy";

test("bundleTasks bundles non-overlapping tasks up to max of 2", () => {
  const tasks = [
    { id: "TASK-1", artifactsToTouch: ["docs/arbiter/one.md"] },
    { id: "TASK-2", artifactsToTouch: ["docs/arbiter/two.md"] },
    { id: "TASK-3", artifactsToTouch: ["docs/arbiter/three.md"] }
  ];

  const bundle = bundleTasks(tasks);

  assert.deepEqual(
    bundle.map((task) => task.id),
    ["TASK-1", "TASK-2"]
  );
  assert.equal(bundle.length, 2);
});
