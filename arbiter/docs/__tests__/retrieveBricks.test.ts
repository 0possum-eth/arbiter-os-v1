import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../indexBricks";
import { retrieveBricks } from "../retrieveBricks";

test("retrieveBricks returns best match with source path", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-bricks-"));
  const docsDir = path.join(tempDir, "docs");
  await fs.promises.mkdir(docsDir, { recursive: true });

  const docA = path.join(docsDir, "alpha.md");
  const docB = path.join(docsDir, "beta.md");
  await fs.promises.writeFile(docA, "# Alpha\nThis document talks about widgets.", "utf8");
  await fs.promises.writeFile(docB, "# Beta\nThis document is about frobnication.", "utf8");

  const indexPath = path.join(tempDir, "index.jsonl");
  await indexBricks(docsDir, indexPath);

  const results = await retrieveBricks(indexPath, "frobnication", 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].path, docB);
});
