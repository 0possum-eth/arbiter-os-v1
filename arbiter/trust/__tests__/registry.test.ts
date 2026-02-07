import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { approveDoc, isTrusted } from "../commands";

test("approveDoc records trust in registry", async () => {
  const originalEnv = process.env.ARBITER_TRUST_PATH;
  const originalCwd = process.cwd();
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-trust-"));
  const registryPath = path.join(tempDir, "trust.json");
  const docPath = path.join(tempDir, "docs", "arbiter", "reference", "trusted.md");
  const normalizedDocPath = docPath.replace(/\\/g, "/");
  let prior: string | null = null;

  try {
    process.env.ARBITER_TRUST_PATH = registryPath;
    prior = await fs.promises.readFile(registryPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }

  try {
    await fs.promises.mkdir(path.dirname(docPath), { recursive: true });
    await fs.promises.writeFile(docPath, "# trusted\n", "utf8");
    await approveDoc(docPath);

    const raw = await fs.promises.readFile(registryPath, "utf8");
    const parsed = JSON.parse(raw) as {
      records?: Record<string, { approved?: boolean; hash?: string; approvedAt?: string }>;
    };
    const record = parsed.records?.[normalizedDocPath];
    assert.equal(record?.approved, true);
    assert.match(record?.hash ?? "", /^[a-f0-9]{64}$/);
    assert.match(record?.approvedAt ?? "", /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(await isTrusted(docPath), true);
  } finally {
    if (prior === null) {
      await fs.promises.unlink(registryPath).catch((err) => {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          throw err;
        }
      });
    } else {
      await fs.promises.writeFile(registryPath, prior, "utf8");
    }
    if (originalEnv === undefined) {
      delete process.env.ARBITER_TRUST_PATH;
    } else {
      process.env.ARBITER_TRUST_PATH = originalEnv;
    }
    process.chdir(originalCwd);
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
