import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runBrainstorm } from "../brainstorm";

test("runBrainstorm writes brainstorm file and returns path", async () => {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "brainstorm-test-"));

  try {
    process.chdir(tempDir);
    const outputPath = await runBrainstorm();

    assert.equal(outputPath, "docs/arbiter/brainstorm.md");

    const absolutePath = path.resolve(outputPath);
    const contents = await fs.readFile(absolutePath, "utf8");
    assert.ok(contents.length > 0);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
