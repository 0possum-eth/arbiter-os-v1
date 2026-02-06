import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { extractPrd } from "../extractPrd";
import { ingestSource } from "../sourceIngest";

const buildPrdDir = (baseDir: string, phase = "phase-01") =>
  path.join(baseDir, "docs", "arbiter", "reference", phase);

test("extractPrd maps PRD metadata to scout envelope", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "extract-prd-test-"));

  try {
    const prdDir = buildPrdDir(tempDir);
    await fs.mkdir(prdDir, { recursive: true });

    const metadata = {
      summary: {
        problemStatement: "Derive a scout envelope from PRD metadata.",
        constraints: ["Use reference docs"],
        unknowns: ["How tasks should be mapped"]
      },
      epic: {
        id: "EPIC-9",
        title: "Extract PRD into scout",
        intent: "Use PRD metadata to seed epic tasks",
        tasks: ["Parse PRD metadata", "Map tasks into scout envelope"]
      }
    };

    await fs.writeFile(
      path.join(prdDir, "PRD_metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    const output = await extractPrd({ baseDir: tempDir });
    assert.ok(output);
    const scout = output;

    assert.equal(scout.summary.problemStatement, metadata.summary.problemStatement);
    assert.equal(scout.candidates[0].title, metadata.epic.title);
    assert.deepEqual(scout.candidates[0].artifactsToTouch, metadata.epic.tasks);
    assert.deepEqual(scout.candidates[0].scope.included, metadata.epic.tasks);
    assert.equal(scout.recommendation.candidateId, metadata.epic.id);

    const sourcesPath = path.join(prdDir, "sources.jsonl");
    const sourcesRaw = await fs.readFile(sourcesPath, "utf8");
    const sourceEntries = sourcesRaw
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { ts: string; source: string; hash: string; phase: string });

    assert.equal(sourceEntries.length, 1);
    assert.equal(sourceEntries[0].phase, "phase-01");
    assert.equal(sourceEntries[0].source, "docs/arbiter/reference/phase-01/PRD_metadata.json");
    assert.equal(sourceEntries[0].hash.length, 64);

    assert.deepEqual(scout.metadata.evidence.sources, sourceEntries);
    assert.equal(scout.candidates[0].taskData.length, metadata.epic.tasks.length);
    assert.equal(scout.candidates[0].taskData[0].title, metadata.epic.tasks[0]);
    assert.deepEqual(scout.candidates[0].taskData[0].sourceRef, {
      source: sourceEntries[0].source,
      hash: sourceEntries[0].hash,
      phase: sourceEntries[0].phase
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("extractPrd returns null when PRD metadata JSON is malformed", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "extract-prd-malformed-test-"));

  try {
    const prdDir = buildPrdDir(tempDir);
    await fs.mkdir(prdDir, { recursive: true });
    await fs.writeFile(path.join(prdDir, "PRD_metadata.json"), "{not valid json", "utf8");

    const output = await extractPrd({ baseDir: tempDir });
    assert.equal(output, null);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("ingestSource rejects invalid phase names", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "extract-prd-phase-test-"));

  try {
    await assert.rejects(
      () =>
        ingestSource({
          source: "docs/arbiter/reference/phase-01/PRD_metadata.json",
          phase: "../phase-01",
          content: "{}",
          baseDir: tempDir
        }),
      /Invalid phase/
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
