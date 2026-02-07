import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildViews } from "../buildViews";
import { LEDGER_SCHEMA_VERSION } from "../events";

test("buildViews writes progress view and snapshots", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-progress-"));
  const arbiterDir = path.join(tempDir, "docs", "arbiter");
  const ledgerPath = path.join(arbiterDir, "_ledger", "prd.events.jsonl");
  await fs.promises.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.promises.writeFile(
    ledgerPath,
    [
      JSON.stringify({
        schemaVersion: LEDGER_SCHEMA_VERSION,
        ts: "t",
        op: "epic_selected",
        id: "EPIC-1",
        data: { epicId: "EPIC-1" }
      }),
      JSON.stringify({
        schemaVersion: LEDGER_SCHEMA_VERSION,
        ts: "t",
        op: "task_upsert",
        id: "TASK-1",
        data: { epicId: "EPIC-1" }
      }),
      JSON.stringify({
        schemaVersion: LEDGER_SCHEMA_VERSION,
        ts: "t",
        op: "task_done",
        id: "TASK-1",
        data: { epicId: "EPIC-1" }
      })
    ].join("\n") + "\n",
    "utf8"
  );

  await fs.promises.mkdir(arbiterDir, { recursive: true });
  await fs.promises.writeFile(path.join(arbiterDir, "prd.json"), "{\"prior\":true}\n", "utf8");
  await fs.promises.writeFile(path.join(arbiterDir, "progress.txt"), "EPIC-0\n- [ ] TASK-0\n", "utf8");

  await buildViews(ledgerPath, arbiterDir);

  const progressPath = path.join(arbiterDir, "progress.txt");
  const prdSnapshotsPath = path.join(arbiterDir, "build-log", "prd.snapshots.log");
  const progressSnapshotsPath = path.join(arbiterDir, "build-log", "progress.snapshots.log");

  assert.ok(fs.existsSync(progressPath));
  assert.ok(fs.existsSync(prdSnapshotsPath));
  assert.ok(fs.existsSync(progressSnapshotsPath));

  const progress = await fs.promises.readFile(progressPath, "utf8");
  assert.equal(progress, "EPIC-1\n- [x] TASK-1\n");

  const prdSnapshots = await fs.promises.readFile(prdSnapshotsPath, "utf8");
  assert.ok(prdSnapshots.includes("\"prior\":true"));

  const progressSnapshots = await fs.promises.readFile(progressSnapshotsPath, "utf8");
  assert.ok(progressSnapshots.includes("EPIC-0"));
});
