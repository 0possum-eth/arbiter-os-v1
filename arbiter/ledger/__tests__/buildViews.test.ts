import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildViews } from "../buildViews";

test("buildViews regenerates prd.json from events", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-views-"));
  const ledgerPath = path.join(tempDir, "_ledger", "prd.events.jsonl");
  await fs.promises.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.promises.writeFile(
    ledgerPath,
    [
      JSON.stringify({ ts: "t", op: "epic_selected", id: "EPIC-1", data: { epicId: "EPIC-1" } }),
      JSON.stringify({ ts: "t", op: "task_upsert", id: "TASK-1", data: { epicId: "EPIC-1" } }),
      JSON.stringify({ ts: "t", op: "task_done", id: "TASK-1", data: { epicId: "EPIC-1" } })
    ].join("\n") + "\n",
    "utf8"
  );

  const viewsDir = path.join(tempDir, "views");
  await buildViews(ledgerPath, viewsDir);

  const prd = JSON.parse(await fs.promises.readFile(path.join(viewsDir, "prd.json"), "utf8"));
  assert.equal(prd.activeEpicId, "EPIC-1");
  assert.equal(prd.epics[0].tasks[0].done, true);
});
