import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { inspectState } from "../inspectState";

test("inspectState reads active epic from derived prd.json", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-inspect-"));
  const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
  await fs.promises.mkdir(path.dirname(prdPath), { recursive: true });
  await fs.promises.writeFile(
    prdPath,
    JSON.stringify({ activeEpicId: "EPIC-1", epics: [{ id: "EPIC-1", done: false }] }),
    "utf8"
  );
  const original = process.cwd();
  process.chdir(tempDir);
  try {
    const state = await inspectState();
    assert.equal(state.status, "ACTIVE_EPIC");
  } finally {
    process.chdir(original);
  }
});
