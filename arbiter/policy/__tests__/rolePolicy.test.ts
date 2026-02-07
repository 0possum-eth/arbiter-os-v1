import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { evaluateRolePolicy } from "../rolePolicy";

test("read-only role cannot run write tools", () => {
  const result = evaluateRolePolicy({
    role: "verifier-spec",
    toolName: "writeFile",
    targets: ["docs/arbiter/notes.txt"]
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /read-only role/i);
});

test("read-only role can run read tools", () => {
  const result = evaluateRolePolicy({
    role: "verifier-quality",
    toolName: "readFile",
    targets: ["docs/arbiter/notes.txt"]
  });

  assert.equal(result.allowed, true);
});

test("ledger-keeper can write ledger and view paths", () => {
  const ledgerResult = evaluateRolePolicy({
    role: "ledger-keeper",
    toolName: "writeFile",
    targets: ["docs/arbiter/_ledger/runs/2026-02-06.jsonl"]
  });
  const viewResult = evaluateRolePolicy({
    role: "ledger-keeper",
    toolName: "writeFile",
    targets: ["docs/arbiter/progress.txt"]
  });

  assert.equal(ledgerResult.allowed, true);
  assert.equal(viewResult.allowed, true);
});

test("ledger-keeper cannot write outside ledger and views", () => {
  const result = evaluateRolePolicy({
    role: "ledger-keeper",
    toolName: "writeFile",
    targets: ["docs/arbiter/notes/todo.md"]
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /ledger-keeper/i);
});

test("unknown role cannot run write tools", () => {
  const result = evaluateRolePolicy({
    role: "unknown",
    toolName: "writeFile",
    targets: ["docs/arbiter/notes/todo.md"]
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /unknown role/i);
});

test("write tools with no targets are denied", () => {
  const result = evaluateRolePolicy({
    role: "executor",
    toolName: "bash",
    targets: []
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /requires explicit target paths/i);
});

test("write tools with unknown payload shapes are denied fail-closed", () => {
  const result = evaluateRolePolicy({
    role: "executor",
    toolName: "writeFile",
    targets: [],
    targetExtractionError: "Cannot determine targets for write tool writeFile"
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /unsupported payload shape/i);
});

test("executor can run write tools with non-ledger targets", () => {
  const result = evaluateRolePolicy({
    role: "executor",
    toolName: "writeFile",
    targets: ["docs/arbiter/notes/todo.md"]
  });

  assert.equal(result.allowed, true);
});

test("arbiter can run write tools with non-ledger targets", () => {
  const result = evaluateRolePolicy({
    role: "arbiter",
    toolName: "writeFile",
    targets: ["docs/arbiter/notes/todo.md"]
  });

  assert.equal(result.allowed, true);
});

test("arbiter cannot write ledger and view paths directly", () => {
  const ledgerResult = evaluateRolePolicy({
    role: "arbiter",
    toolName: "writeFile",
    targets: ["docs/arbiter/_ledger/runs/2026-02-06.jsonl"]
  });
  const viewResult = evaluateRolePolicy({
    role: "arbiter",
    toolName: "writeFile",
    targets: ["docs/arbiter/progress.txt"]
  });

  assert.equal(ledgerResult.allowed, false);
  assert.match(ledgerResult.reason || "", /ledger keeper/i);
  assert.equal(viewResult.allowed, false);
  assert.match(viewResult.reason || "", /ledger keeper/i);
});

test("agent prompt documents arbiter write-power boundaries", async () => {
  const promptPath = path.join(process.cwd(), "docs", "arbiter", "agent-prompt.md");
  const content = await fs.promises.readFile(promptPath, "utf8");

  assert.match(content, /Arbiter can execute non-ledger write tools/i);
  assert.match(content, /Ledger writes must go through Ledger Keeper/i);
});
