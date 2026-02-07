import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { ArbiterOsPlugin } from "../../../.opencode/plugins/arbiter-os.js";
import { queryMemory } from "../query";
import { readMemoryEntries, writeMemoryEntry } from "../store";

test("memory store writes and reads JSONL entries by scope", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-memory-store-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    await writeMemoryEntry("session", { note: "session note" });
    await writeMemoryEntry("project", { note: "project note" });
    await writeMemoryEntry("personal", { note: "personal note" });

    const sessionEntries = await readMemoryEntries("session");
    const projectEntries = await readMemoryEntries("project");
    const personalEntries = await readMemoryEntries("personal");

    assert.equal(sessionEntries.length, 1);
    assert.equal(projectEntries.length, 1);
    assert.equal(personalEntries.length, 1);

    assert.equal((sessionEntries[0].data as { note: string }).note, "session note");
    assert.equal((projectEntries[0].data as { note: string }).note, "project note");
    assert.equal((personalEntries[0].data as { note: string }).note, "personal note");

    assert.ok(fs.existsSync(path.join(tempDir, "docs", "arbiter", "_memory", "session.jsonl")));
    assert.ok(fs.existsSync(path.join(tempDir, "docs", "arbiter", "_memory", "project.jsonl")));
    assert.ok(fs.existsSync(path.join(tempDir, "docs", "arbiter", "_memory", "personal.jsonl")));
  } finally {
    process.chdir(originalCwd);
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("compaction summary includes continuity across memory tiers", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-memory-summary-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    await writeMemoryEntry("session", "Fixing task 10");
    await writeMemoryEntry("project", "Memory tiers added");
    await writeMemoryEntry("personal", "Prefer deterministic stores");

    const plugin = await ArbiterOsPlugin();
    const compacted = await plugin["experimental.session.compacting"]();

    assert.match(compacted.summary, /session: Fixing task 10/i);
    assert.match(compacted.summary, /project: Memory tiers added/i);
    assert.match(compacted.summary, /personal: Prefer deterministic stores/i);
  } finally {
    process.chdir(originalCwd);
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("compaction summary handles undefined memory payload safely", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-memory-undefined-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    await writeMemoryEntry("session", undefined);

    const sessionEntries = await readMemoryEntries("session");
    assert.equal(sessionEntries.length, 1);
    assert.equal(sessionEntries[0].data, null);

    const plugin = await ArbiterOsPlugin();
    const compacted = await plugin["experimental.session.compacting"]();
    assert.match(compacted.summary, /session: none/i);
  } finally {
    process.chdir(originalCwd);
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("queryMemory returns most relevant project memory entries", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-memory-query-"));
  const originalCwd = process.cwd();
  process.chdir(tempDir);

  try {
    await writeMemoryEntry("project", { note: "release checklist and rollout readiness" });
    await writeMemoryEntry("project", { note: "unrelated maintenance backlog" });

    const memoryContext = await queryMemory({ scope: "project", query: "release rollout", limit: 1 });
    assert.equal(memoryContext.length, 1);
    assert.match(JSON.stringify(memoryContext[0].data), /release checklist/i);
  } finally {
    process.chdir(originalCwd);
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
