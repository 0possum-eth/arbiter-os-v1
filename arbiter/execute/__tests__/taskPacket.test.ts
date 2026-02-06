import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../../docs/indexBricks";
import { buildTaskPacket } from "../taskPacket";

test("buildTaskPacket includes task id, context pack, and citations", async () => {
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

    assert.equal(packet.taskId, "TASK-1");
    assert.equal(packet.contextPack, expectedPack);
    assert.deepEqual(packet.citations, [`${normalizedA}#Alpha`, `${normalizedB}#Beta`]);
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
