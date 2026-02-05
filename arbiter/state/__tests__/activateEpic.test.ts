import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { activateEpic } from "../activateEpic";

test("activateEpic writes active epic and task events", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-activate-"));
  const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");

  await activateEpic(ledgerPath, {
    id: "EPIC-1",
    tasks: [{ id: "TASK-1", noop: true }]
  });

  const content = await fs.promises.readFile(ledgerPath, "utf8");
  assert.ok(content.includes("epic_selected"));
  assert.ok(content.includes("task_upsert"));
});
