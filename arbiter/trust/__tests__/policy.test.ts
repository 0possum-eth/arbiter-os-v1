import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { approveDoc } from "../commands";
import { canMountForExecution, classifyBrick } from "../policy";
import { ArbiterOsPlugin } from "../../../.opencode/plugins/arbiter-os.js";

test("classifyBrick separates knowledge and behavior bricks", () => {
  assert.equal(classifyBrick("docs/arbiter/reference/handbook.md"), "knowledge");
  assert.equal(classifyBrick("docs/arbiter/knowledge/patterns.md"), "knowledge");
  assert.equal(classifyBrick("docs/arbiter/behavior/guardrails.md"), "behavior");
  assert.equal(classifyBrick("docs/arbiter/notes/todo.md"), "behavior");
});

test("canMountForExecution allows only trusted behavior bricks", () => {
  assert.equal(canMountForExecution("docs/arbiter/reference/handbook.md", false), true);
  assert.equal(canMountForExecution("docs/arbiter/behavior/guardrails.md", false), false);
  assert.equal(canMountForExecution("docs/arbiter/behavior/guardrails.md", true), true);
});

test("plugin enforces trust whenever mounted docs are provided", async () => {
  const plugin = await ArbiterOsPlugin();

  await assert.rejects(
    () =>
      plugin["tool.execute.before"]({
        name: "runTask",
        args: {
          mountedDocs: [
            {
              packPath: "docs/arbiter/context-packs/behavior-pack.md",
              brickType: "behavior",
              trusted: false
            }
          ]
        }
      }),
    /untrusted docs mounted/i
  );

  await assert.rejects(
    () =>
      plugin["tool.execute.before"]({
        name: "buildContextPack",
        args: {
          mountedDocs: [
            {
              packPath: "docs/arbiter/context-packs/behavior-pack.md",
              brickType: "behavior",
              trusted: false
            }
          ]
        }
      }),
    /untrusted docs mounted/i
  );

  await assert.rejects(
    () =>
      plugin["tool.execute.before"]({
        name: "writeFile",
        args: {
          mountedDocs: [
            {
              packPath: "docs/arbiter/context-packs/behavior-pack.md",
              brickType: "behavior",
              trusted: false
            }
          ]
        }
      }),
    /untrusted docs mounted/i
  );

  await plugin["tool.execute.before"]({
    name: "buildContextPack",
    args: {
      mountedDocs: [
        {
          packPath: "docs/arbiter/knowledge/knowledge-pack.md",
          brickType: "knowledge",
          trusted: false
        }
      ]
    }
  });
});

test("plugin blocks untrusted behavior doc even when payload forges trusted=true", async () => {
  const plugin = await ArbiterOsPlugin();

  await assert.rejects(
    () =>
      plugin["tool.execute.before"]({
        name: "buildContextPack",
        args: {
          mountedDocs: [
            {
              packPath: "docs/arbiter/context-packs/behavior-pack.md",
              sourcePath: "docs/arbiter/behavior/untrusted.md",
              brickType: "behavior",
              trusted: true
            }
          ]
        }
      }),
    /untrusted docs mounted/i
  );
});

test("plugin blocks behavior doc even when payload forges brickType=knowledge", async () => {
  const plugin = await ArbiterOsPlugin();

  await assert.rejects(
    () =>
      plugin["tool.execute.before"]({
        name: "buildContextPack",
        args: {
          mountedDocs: [
            {
              packPath: "docs/arbiter/context-packs/behavior-pack.md",
              sourcePath: "docs/arbiter/behavior/untrusted.md",
              brickType: "knowledge",
              trusted: false
            }
          ]
        }
      }),
    /untrusted docs mounted/i
  );
});

test("plugin accepts trusted mounted behavior doc when sourcePath is trusted", async () => {
  const originalTrustPath = process.env.ARBITER_TRUST_PATH;
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-trust-policy-"));
  const trustedSourcePath = path.join(tempDir, "docs", "arbiter", "behavior", "trusted.md");

  try {
    process.env.ARBITER_TRUST_PATH = path.join(tempDir, "trust.json");
    await approveDoc(trustedSourcePath);

    const plugin = await ArbiterOsPlugin();
    await plugin["tool.execute.before"]({
      name: "buildContextPack",
      args: {
        mountedDocs: [
          {
            packPath: "docs/arbiter/context-packs/behavior-pack.md",
            sourcePath: trustedSourcePath,
            brickType: "behavior",
            trusted: false
          }
        ]
      }
    });
  } finally {
    if (originalTrustPath === undefined) {
      delete process.env.ARBITER_TRUST_PATH;
    } else {
      process.env.ARBITER_TRUST_PATH = originalTrustPath;
    }
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
