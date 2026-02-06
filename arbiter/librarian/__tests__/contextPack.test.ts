import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { indexBricks } from "../../docs/indexBricks";
import { approveDoc } from "../../trust/commands";
import { CONTEXT_PACK_HARD_CAP, contextPack } from "../contextPack";

test("contextPack returns top two bricks with provenance and trust labels", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  const originalTrustEnv = process.env.ARBITER_TRUST_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-context-"));
  const docsDir = path.join(tempDir, "docs");
  await fs.promises.mkdir(docsDir, { recursive: true });

  const docA = path.join(docsDir, "alpha.md");
  const docB = path.join(docsDir, "beta.md");
  const docC = path.join(docsDir, "gamma.md");

  await fs.promises.writeFile(docA, "# Alpha\nThis section mentions spark and frob.", "utf8");
  await fs.promises.writeFile(docB, "# Beta\nThis section mentions spark only.", "utf8");
  await fs.promises.writeFile(docC, "# Gamma\nThis section is unrelated.", "utf8");

  const indexPath = path.join(tempDir, "index.jsonl");
  const trustPath = path.join(tempDir, "trust.json");
  await indexBricks(docsDir, indexPath);
  process.env.ARBITER_DOCS_INDEX_PATH = indexPath;
  process.env.ARBITER_TRUST_PATH = trustPath;
  await approveDoc(docA);

  try {
    const pack = await contextPack("spark frob", { includeTrustLabels: true });
    const normalizedA = docA.replace(/\\/g, "/");
    const normalizedB = docB.replace(/\\/g, "/");

    assert.equal(
      pack,
      [
        "## Context Pack",
        `- [${normalizedA}#Alpha] (trusted) This section mentions spark and frob.`,
        `- [${normalizedB}#Beta] (untrusted) This section mentions spark only.`
      ].join("\n")
    );
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    if (originalTrustEnv === undefined) {
      delete process.env.ARBITER_TRUST_PATH;
    } else {
      process.env.ARBITER_TRUST_PATH = originalTrustEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("contextPack enforces hard size cap", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-context-cap-"));
  const docsDir = path.join(tempDir, "docs");
  await fs.promises.mkdir(docsDir, { recursive: true });

  const longContent = "spark ".repeat(CONTEXT_PACK_HARD_CAP);
  const hugeDoc = path.join(docsDir, "huge.md");
  await fs.promises.writeFile(hugeDoc, `# Huge\n${longContent}`, "utf8");

  const indexPath = path.join(tempDir, "index.jsonl");
  await indexBricks(docsDir, indexPath);
  process.env.ARBITER_DOCS_INDEX_PATH = indexPath;

  try {
    const pack = await contextPack("spark");
    assert.ok(pack.length <= CONTEXT_PACK_HARD_CAP);
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("contextPack can filter to trusted allowed sources", async () => {
  const originalEnv = process.env.ARBITER_DOCS_INDEX_PATH;
  const originalTrustEnv = process.env.ARBITER_TRUST_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-context-trusted-"));
  const docsDir = path.join(tempDir, "docs");
  await fs.promises.mkdir(docsDir, { recursive: true });

  const trustedDoc = path.join(docsDir, "trusted.md");
  const untrustedDoc = path.join(docsDir, "untrusted.md");
  const indexPath = path.join(tempDir, "index.jsonl");
  const trustPath = path.join(tempDir, "trust.json");

  await fs.promises.writeFile(
    trustedDoc,
    "# Trusted\nexecution guidance spark signal and trusted flow.",
    "utf8"
  );
  await fs.promises.writeFile(
    untrustedDoc,
    "# Untrusted\nexecution guidance spark signal and untrusted flow.",
    "utf8"
  );

  await indexBricks(docsDir, indexPath);
  process.env.ARBITER_DOCS_INDEX_PATH = indexPath;
  process.env.ARBITER_TRUST_PATH = trustPath;
  await approveDoc(trustedDoc);

  try {
    const pack = await contextPack("execution guidance spark", {
      includeTrustLabels: true,
      requireTrusted: true,
      allowedSourcePaths: [trustedDoc]
    });
    const normalizedTrusted = trustedDoc.replace(/\\/g, "/");
    const normalizedUntrusted = untrustedDoc.replace(/\\/g, "/");

    assert.ok(pack.includes(`[${normalizedTrusted}#Trusted] (trusted)`));
    assert.equal(pack.includes(normalizedUntrusted), false);
  } finally {
    if (originalEnv === undefined) {
      delete process.env.ARBITER_DOCS_INDEX_PATH;
    } else {
      process.env.ARBITER_DOCS_INDEX_PATH = originalEnv;
    }
    if (originalTrustEnv === undefined) {
      delete process.env.ARBITER_TRUST_PATH;
    } else {
      process.env.ARBITER_TRUST_PATH = originalTrustEnv;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
