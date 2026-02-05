import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { ingestDoc } from "../ingestDoc";

test("ingestDoc copies into reference inbox and marks untrusted", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-doc-"));
  const src = path.join(tempDir, "source.md");
  await fs.promises.writeFile(src, "hello", "utf8");
  const result = await ingestDoc(src, tempDir);
  assert.ok(result.destPath.includes("reference" + path.sep + "_inbox"));
  assert.equal(result.trusted, false);
});
