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
  const originalRole = process.env.ARBITER_ROLE;
  process.env.ARBITER_ROLE = "executor";
  const plugin = await ArbiterOsPlugin();

  try {
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
            path: "docs/arbiter/notes/test.md",
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
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
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

test("plugin rejects write tools for read-only verifier roles", async () => {
  const originalRole = process.env.ARBITER_ROLE;
  process.env.ARBITER_ROLE = "verifier-spec";

  try {
    const plugin = await ArbiterOsPlugin();
    await assert.rejects(
      () =>
        plugin["tool.execute.before"]({
          name: "writeFile",
          args: { path: "docs/arbiter/notes/todo.md" }
        }),
      /read-only role/i
    );
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
});

test("plugin allows read tools for read-only verifier roles", async () => {
  const originalRole = process.env.ARBITER_ROLE;
  process.env.ARBITER_ROLE = "verifier-quality";

  try {
    const plugin = await ArbiterOsPlugin();
    await plugin["tool.execute.before"]({
      name: "readFile",
      args: { path: "docs/arbiter/notes/todo.md" }
    });
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
});

test("plugin restricts ledger-keeper writes to ledger and view paths", async () => {
  const originalRole = process.env.ARBITER_ROLE;
  process.env.ARBITER_ROLE = "ledger-keeper";

  try {
    const plugin = await ArbiterOsPlugin();

    await assert.rejects(
      () =>
        plugin["tool.execute.before"]({
          name: "writeFile",
          args: { path: "docs/arbiter/notes/todo.md" }
        }),
      /ledger-keeper/i
    );

    await plugin["tool.execute.before"]({
      name: "writeFile",
      args: { path: "docs/arbiter/progress.txt" }
    });
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
});

test("plugin rejects write tools for unknown roles", async () => {
  const originalRole = process.env.ARBITER_ROLE;
  delete process.env.ARBITER_ROLE;

  try {
    const plugin = await ArbiterOsPlugin();
    await assert.rejects(
      () =>
        plugin["tool.execute.before"]({
          name: "writeFile",
          args: { path: "docs/arbiter/notes/todo.md" }
        }),
      /unknown role/i
    );
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
});

test("plugin rejects pathless write tools", async () => {
  const originalRole = process.env.ARBITER_ROLE;
  process.env.ARBITER_ROLE = "executor";

  try {
    const plugin = await ArbiterOsPlugin();
    await assert.rejects(
      () =>
        plugin["tool.execute.before"]({
          name: "bash",
          args: { command: "npm test" }
        }),
      /requires explicit target paths/i
    );
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
});

test("plugin resolves write targets from filePath key", async () => {
  const originalRole = process.env.ARBITER_ROLE;
  process.env.ARBITER_ROLE = "executor";

  try {
    const plugin = await ArbiterOsPlugin();
    await plugin["tool.execute.before"]({
      name: "writeFile",
      args: { filePath: "docs/arbiter/notes/todo.md" }
    });
  } finally {
    if (originalRole === undefined) {
      delete process.env.ARBITER_ROLE;
    } else {
      process.env.ARBITER_ROLE = originalRole;
    }
  }
});
