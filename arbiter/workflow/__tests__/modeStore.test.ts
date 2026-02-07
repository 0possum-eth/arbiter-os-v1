import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { readWorkflowProfile, writeWorkflowProfile } from "../modeStore";

test("readWorkflowProfile defaults to hybrid_guided when config is missing", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-mode-store-"));

  const profile = await readWorkflowProfile({ rootDir: tempDir });

  assert.equal(profile, "hybrid_guided");
});

test("writeWorkflowProfile persists selected profile", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-mode-store-"));

  await writeWorkflowProfile("arbiter_core", { rootDir: tempDir });
  const profile = await readWorkflowProfile({ rootDir: tempDir });

  assert.equal(profile, "arbiter_core");
});

test("readWorkflowProfile falls back to hybrid_guided for invalid config", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-mode-store-"));
  const modePath = path.join(tempDir, "docs", "arbiter", "workflow-profile.json");

  await fs.mkdir(path.dirname(modePath), { recursive: true });
  await fs.writeFile(modePath, JSON.stringify({ profile: "invalid_mode" }), "utf8");

  const profile = await readWorkflowProfile({ rootDir: tempDir });
  assert.equal(profile, "hybrid_guided");
});
