import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../indexBricks";
import { retrieveBricks } from "../retrieveBricks";

test("retrieveBricks boosts semantic-like release matches", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-retrieval-quality-"));
  const docsDir = path.join(tempDir, "docs");
  const phaseDir = path.join(docsDir, "phase-02");

  try {
    await fs.promises.mkdir(phaseDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(phaseDir, "spec.md"),
      "# Phase Two Spec\nrelease plan and launch readiness checklist.",
      "utf8"
    );
    await fs.promises.writeFile(path.join(docsDir, "notes.md"), "# Notes\nshipping checklist only.", "utf8");

    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(docsDir, indexPath);

    const results = await retrieveBricks(indexPath, "shipping plan", 1);
    assert.equal(results.length, 1);
    assert.equal(results[0].path.endsWith(path.join("phase-02", "spec.md")), true);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("retrieveBricks ranking is deterministic across repeated calls", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-retrieval-stable-"));
  const docsDir = path.join(tempDir, "docs");

  try {
    await fs.promises.mkdir(docsDir, { recursive: true });
    await fs.promises.writeFile(path.join(docsDir, "a.md"), "# Alpha\nrelease plan details", "utf8");
    await fs.promises.writeFile(path.join(docsDir, "b.md"), "# Beta\nrelease readiness details", "utf8");
    await fs.promises.writeFile(path.join(docsDir, "c.md"), "# Gamma\nshipping release notes", "utf8");

    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(docsDir, indexPath);

    const first = await retrieveBricks(indexPath, "release plan", 3);
    const second = await retrieveBricks(indexPath, "release plan", 3);
    assert.deepEqual(
      first.map((entry) => entry.path),
      second.map((entry) => entry.path)
    );
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
