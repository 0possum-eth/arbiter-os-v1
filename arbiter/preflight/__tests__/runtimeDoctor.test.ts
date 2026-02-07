import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runRuntimeDoctor } from "../runtimeDoctor";

test("runRuntimeDoctor reports missing git and node prerequisites", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-runtime-doctor-"));

  const result = await runRuntimeDoctor({
    rootDir,
    commandExists: () => false
  });

  assert.equal(result.envReady, false);
  assert.deepEqual(result.missingPrerequisites.sort(), ["git", "node"]);
});

test("runRuntimeDoctor reports missing package manager when package.json exists", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-runtime-doctor-"));
  await fs.writeFile(path.join(rootDir, "package.json"), JSON.stringify({ name: "x" }), "utf8");

  const result = await runRuntimeDoctor({
    rootDir,
    commandExists: (name) => name === "git" || name === "node"
  });

  assert.equal(result.envReady, false);
  assert.deepEqual(result.missingToolchain, ["package-manager"]);
});

test("runRuntimeDoctor is ready when prerequisites and toolchain are available", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "arbiter-runtime-doctor-"));
  await fs.writeFile(path.join(rootDir, "package.json"), JSON.stringify({ name: "x" }), "utf8");

  const result = await runRuntimeDoctor({
    rootDir,
    commandExists: (name) => ["git", "node", "npm"].includes(name)
  });

  assert.equal(result.envReady, true);
  assert.deepEqual(result.missingPrerequisites, []);
  assert.deepEqual(result.missingToolchain, []);
});
