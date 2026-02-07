import assert from "node:assert/strict";
import { test } from "node:test";

import { buildInstallPlan } from "../installPlanner";

test("buildInstallPlan builds Windows actions for missing prerequisites and toolchain", () => {
  const plan = buildInstallPlan(
    {
      envReady: false,
      missingPrerequisites: ["git", "node"],
      missingToolchain: ["package-manager"]
    },
    { platform: "win32" }
  );

  assert.equal(plan.actions.length, 3);
  assert.equal(plan.actions[0].target, "git");
  assert.match(plan.actions[0].command, /winget/);
});

test("buildInstallPlan builds Linux actions for missing prerequisites", () => {
  const plan = buildInstallPlan(
    {
      envReady: false,
      missingPrerequisites: ["git"],
      missingToolchain: []
    },
    { platform: "linux" }
  );

  assert.equal(plan.actions.length, 1);
  assert.equal(plan.actions[0].target, "git");
  assert.match(plan.actions[0].command, /apt-get/);
});
