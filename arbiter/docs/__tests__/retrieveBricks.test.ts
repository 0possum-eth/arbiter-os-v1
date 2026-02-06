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
  try {
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
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("retrieveBricks uses file-path metadata for matching", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-bricks-"));
  const docsDir = path.join(tempDir, "docs");
  try {
    await fs.promises.mkdir(docsDir, { recursive: true });

    const docA = path.join(docsDir, "deploy-runbook.md");
    const docB = path.join(docsDir, "notes.md");
    await fs.promises.writeFile(docA, "# Operations\nGeneral process guidance.", "utf8");
    await fs.promises.writeFile(docB, "# Runbook\nThis page covers unrelated topics.", "utf8");

    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(docsDir, indexPath);

    const results = await retrieveBricks(indexPath, "deploy runbook", 1);
    assert.equal(results.length, 1);
    assert.equal(results[0].path, docA);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("retrieveBricks applies diversity penalty across same source file", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-bricks-"));
  const docsDir = path.join(tempDir, "docs");
  try {
    await fs.promises.mkdir(docsDir, { recursive: true });

    const dominant = path.join(docsDir, "aaa-dominant.md");
    const alternative = path.join(docsDir, "zzz-alternative.md");
    await fs.promises.writeFile(
      dominant,
      [
        "# Incident Response",
        "incident response playbook for on-call incidents.",
        "",
        "# Incident Escalation",
        "incident response playbook with escalation checklist."
      ].join("\n"),
      "utf8"
    );
    await fs.promises.writeFile(
      alternative,
      "# Incident Procedures\nincident response playbook and response ownership details.",
      "utf8"
    );

    const indexPath = path.join(tempDir, "index.jsonl");
    await indexBricks(docsDir, indexPath);

    const results = await retrieveBricks(indexPath, "incident response playbook", 2);
    assert.equal(results.length, 2);
    assert.notEqual(results[0].path, results[1].path);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("indexBricks includes nested markdown files and deterministic ordering", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-bricks-"));
  const docsDir = path.join(tempDir, "docs");
  const nestedDir = path.join(docsDir, "phase-02");
  const indexPath = path.join(tempDir, "index.jsonl");

  try {
    await fs.promises.mkdir(nestedDir, { recursive: true });
    const rootDoc = path.join(docsDir, "a-root.md");
    const nestedDoc = path.join(nestedDir, "spec.md");
    await fs.promises.writeFile(rootDoc, "# Root\nroot details", "utf8");
    await fs.promises.writeFile(nestedDoc, "# Phase 2\nphase 2 spec details", "utf8");

    await indexBricks(docsDir, indexPath);
    const firstIndex = await fs.promises.readFile(indexPath, "utf8");
    const results = await retrieveBricks(indexPath, "phase 2 spec", 1);
    assert.equal(results.length, 1);
    assert.equal(results[0].path, nestedDoc);

    await indexBricks(docsDir, indexPath);
    const secondIndex = await fs.promises.readFile(indexPath, "utf8");
    assert.equal(firstIndex, secondIndex);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
