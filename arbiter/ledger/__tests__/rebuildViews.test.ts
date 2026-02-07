import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { appendEvent } from "../appendEvent";
import { LEDGER_SCHEMA_VERSION } from "../events";
import { rebuildViewsFromLedger } from "../rebuildViews";

test("appendEvent writes schema version for each event", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-schema-"));
  const ledgerPath = path.join(tempDir, "prd.events.jsonl");

  await appendEvent(ledgerPath, {
    ts: "2026-02-06T00:00:00.000Z",
    op: "task_upsert",
    id: "TASK-1",
    data: { epicId: "EPIC-1", task: { id: "TASK-1", done: false } }
  });

  const [line] = (await fs.promises.readFile(ledgerPath, "utf8")).trim().split("\n");
  const event = JSON.parse(line) as { schemaVersion?: string };
  assert.equal(event.schemaVersion, LEDGER_SCHEMA_VERSION);
});

test("rebuildViewsFromLedger replays ledger into docs/arbiter views", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-replay-"));
  const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");

  await appendEvent(ledgerPath, {
    ts: "2026-02-06T00:00:00.000Z",
    op: "epic_selected",
    id: "EPIC-1",
    data: { epicId: "EPIC-1" }
  });
  await appendEvent(ledgerPath, {
    ts: "2026-02-06T00:00:01.000Z",
    op: "task_upsert",
    id: "TASK-1",
    data: { epicId: "EPIC-1", task: { id: "TASK-1", done: false } }
  });
  await appendEvent(ledgerPath, {
    ts: "2026-02-06T00:00:02.000Z",
    op: "task_done",
    id: "TASK-1",
    data: { epicId: "EPIC-1" }
  });

  await rebuildViewsFromLedger({ ledgerPath, rootDir: tempDir });

  const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
  const progressPath = path.join(tempDir, "docs", "arbiter", "progress.txt");
  const prd = JSON.parse(await fs.promises.readFile(prdPath, "utf8")) as {
    activeEpicId?: string;
    epics?: Array<{ id?: string; tasks?: Array<{ id?: string; done?: boolean }> }>;
  };
  const progress = await fs.promises.readFile(progressPath, "utf8");

  assert.equal(prd.activeEpicId, "EPIC-1");
  assert.equal(prd.epics?.[0]?.tasks?.[0]?.done, true);
  assert.match(progress, /TASK-1/);
});
