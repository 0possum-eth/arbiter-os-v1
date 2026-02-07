import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { appendEvent } from "../appendEvent";
import { LEDGER_SCHEMA_VERSION } from "../events";

test("appendEvent writes JSONL events", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-"));
  const ledgerPath = path.join(tempDir, "prd.events.jsonl");

  await appendEvent(ledgerPath, {
    ts: "2026-02-05T00:00:00Z",
    op: "task_upsert",
    id: "TASK-1",
    data: { title: "Test" }
  });

  const content = await fs.promises.readFile(ledgerPath, "utf8");
  const lines = content.trim().split("\n");
  assert.equal(lines.length, 1);
  const event = JSON.parse(lines[0]);
  assert.equal(event.op, "task_upsert");
  assert.equal(event.schemaVersion, LEDGER_SCHEMA_VERSION);
});
