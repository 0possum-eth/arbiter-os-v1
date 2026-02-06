import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../../docs/indexBricks";
import { buildTaskPacket } from "../taskPacket";
import { runTask } from "../taskRunner";

test("buildTaskPacket includes task id, context pack, citations, and query", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-taskpack-"));
  const docsDir = path.join(tempDir, "docs");
  await fs.promises.mkdir(docsDir, { recursive: true });

  const docA = path.join(docsDir, "alpha.md");
  const docB = path.join(docsDir, "beta.md");
  const docC = path.join(docsDir, "gamma.md");

  await fs.promises.writeFile(docA, "# Alpha\nThis section mentions spark and frob.", "utf8");
  await fs.promises.writeFile(docB, "# Beta\nThis section mentions spark only.", "utf8");
  await fs.promises.writeFile(docC, "# Gamma\nThis section is unrelated.", "utf8");

  const indexPath = path.join(tempDir, "index.jsonl");
  await indexBricks(docsDir, indexPath);
  process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

  try {
    const packet = await buildTaskPacket({ id: "TASK-1", query: "spark frob" });
    const normalizedA = docA.replace(/\\/g, "/");
    const normalizedB = docB.replace(/\\/g, "/");
    const expectedPack = [
      "## Context Pack",
      `- [${normalizedA}#Alpha] This section mentions spark and frob.`,
      `- [${normalizedB}#Beta] This section mentions spark only.`
    ].join("\n");

    assert.deepEqual(packet, {
      taskId: "TASK-1",
      contextPack: expectedPack,
      citations: [`${normalizedA}#Alpha`, `${normalizedB}#Beta`],
      query: "spark frob"
    });

    const noCitationResult = await runTask({ id: "TASK-2", query: "nonexistent terms" });
    assert.deepEqual(noCitationResult, {
      type: "HALT_AND_ASK",
      reason: "CONTEXT_PACK_REQUIRED"
    });

    const withCitationResult = await runTask({ id: "TASK-3", query: "spark frob" });
    assert.deepEqual(withCitationResult, {
      type: "HALT_AND_ASK",
      reason: "Task has no execution strategy yet"
    });

    const noopResult = await runTask({ id: "TASK-NOOP", noop: true, query: "" });
    assert.deepEqual(noopResult, {
      type: "TASK_DONE"
    });
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("noop behavior does not change non-noop behavior", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-taskpack-noop-"));

  try {
    const docsDir = path.join(tempDir, "docs");
    await fs.promises.mkdir(docsDir, { recursive: true });
    const docA = path.join(docsDir, "alpha.md");
    await fs.promises.writeFile(docA, "# Alpha\nSpark token.", "utf8");

    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(docsDir, indexPath);
    process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

    const nonNoop = await runTask({ id: "TASK-X", query: "spark" });
    assert.deepEqual(nonNoop, {
      type: "HALT_AND_ASK",
      reason: "Task has no execution strategy yet"
    });

    const noop = await runTask({ id: "TASK-X", noop: true, query: "spark" });
    assert.deepEqual(noop, { type: "TASK_DONE" });
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("buildTaskPacket falls back to empty context when index path is invalid", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  process.env.ARBITER_DOCS_INDEX_PATH = path.join(os.tmpdir(), "missing-index.jsonl");

  try {
    const packet = await buildTaskPacket({ id: "TASK-FALLBACK", query: "spark" });
    assert.equal(packet.contextPack, "## Context Pack");
    assert.deepEqual(packet.citations, []);
    assert.equal(packet.taskId, "TASK-FALLBACK");
    assert.equal(packet.query, "spark");
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
  }
});

test("runTask returns TASK_ID_MISSING for empty id", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-taskpack-empty-id-"));

  try {
    const docsDir = path.join(tempDir, "docs");
    await fs.promises.mkdir(docsDir, { recursive: true });
    const docA = path.join(docsDir, "alpha.md");
    await fs.promises.writeFile(docA, "# Alpha\nSpark token.", "utf8");

    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(docsDir, indexPath);
    process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

    const result = await runTask({ id: "   ", query: "spark" });
    assert.deepEqual(result, {
      type: "HALT_AND_ASK",
      reason: "TASK_ID_MISSING"
    });
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
