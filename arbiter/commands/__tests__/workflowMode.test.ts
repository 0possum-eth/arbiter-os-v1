import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { workflowMode } from "../workflowMode";

test("workflowMode returns current persisted profile", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-workflow-command-"));

  const result = await workflowMode({}, { rootDir });
  assert.equal(result.profile, "hybrid_guided");
});

test("workflowMode sets and returns selected profile", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-workflow-command-"));

  const result = await workflowMode({ profile: "arbiter_core" }, { rootDir });
  assert.equal(result.profile, "arbiter_core");
});

test("workflowMode accepts dashed profile names", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-workflow-command-"));

  const result = await workflowMode({ profile: "superpowers-core" }, { rootDir });
  assert.equal(result.profile, "superpowers_core");
});
