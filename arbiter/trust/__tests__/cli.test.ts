import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../../docs/indexBricks";
import { approveBrick, listBricks, mountDoc } from "../cli";
import { ArbiterOsPlugin } from "../../../.opencode/plugins/arbiter-os.js";

test("trust CLI commands update registry and list bricks", async () => {
  const originalTrustPath = process.env.ARBITER_TRUST_PATH;
  const originalIndexPath = process.env.ARBITER_DOCS_INDEX_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-trust-cli-"));
  const trustPath = path.join(tempDir, "trust.json");
  const indexPath = path.join(tempDir, "bricks.jsonl");
  const docsDir = path.join(tempDir, "docs");
  const docA = path.join(docsDir, "alpha.md");
  const docB = path.join(docsDir, "beta.md");

  try {
    await fs.promises.mkdir(docsDir, { recursive: true });
    await fs.promises.writeFile(docA, "# Alpha\nThis document is about widgets.", "utf8");
    await fs.promises.writeFile(docB, "# Beta\nThis document covers frobnication.", "utf8");
    await indexBricks(docsDir, indexPath);

    process.env.ARBITER_TRUST_PATH = trustPath;
    process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

    await assert.rejects(() => mountDoc(docA), /not trusted/i);

    const normalizedDocA = docA.replace(/\\/g, "/");
    assert.equal(await approveBrick(docA), normalizedDocA);

    const raw = await fs.promises.readFile(trustPath, "utf8");
    const parsed = JSON.parse(raw) as { trusted?: string[] };
    assert.ok(parsed.trusted?.includes(normalizedDocA));

    const packPath = await mountDoc(docA);
    assert.notEqual(packPath, normalizedDocA);
    assert.ok(packPath.includes("context-packs"));
    await fs.promises.access(path.normalize(packPath));

    const listed = await listBricks();
    const normalizedDocB = docB.replace(/\\/g, "/");
    const expected = [`${normalizedDocA}#Alpha`, `${normalizedDocB}#Beta`].sort();
    assert.deepEqual(listed.sort(), expected);

    const plugin = await ArbiterOsPlugin();
    await assert.rejects(
      () =>
        plugin["tool.execute.before"]({
          name: "runTask",
          args: { mountedDocs: [docB] }
        }),
      /untrusted docs mounted/i
    );
  } finally {
    if (originalTrustPath === undefined) {
      delete process.env.ARBITER_TRUST_PATH;
    } else {
      process.env.ARBITER_TRUST_PATH = originalTrustPath;
    }
    if (originalIndexPath === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalIndexPath;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
