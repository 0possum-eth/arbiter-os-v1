import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runScout } from "../../phases/scout";
import { ingestResearch } from "../researchIngest";
import { synthesizePrd } from "../synthesizePrd";

const buildPhaseDir = (baseDir: string, phase = "phase-01") =>
  path.join(baseDir, "docs", "arbiter", "reference", phase);

test("ingestResearch appends multiple source records", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "research-ingest-test-"));

  try {
    const records = await ingestResearch({
      baseDir: tempDir,
      phase: "phase-02",
      sources: [
        {
          source: "docs/arbiter/brainstorm.md#problem",
          content: "Need a deterministic scout pipeline."
        },
        {
          source: "docs/arbiter/brainstorm.md#tasks",
          content: "- Ingest\n- Synthesize"
        }
      ]
    });

    assert.equal(records.length, 2);
    assert.equal(records[0].source, "docs/arbiter/brainstorm.md#problem");
    assert.equal(records[1].source, "docs/arbiter/brainstorm.md#tasks");

    const sourcesPath = path.join(buildPhaseDir(tempDir, "phase-02"), "sources.jsonl");
    const raw = await fs.readFile(sourcesPath, "utf8");
    const entries = raw
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { source: string; phase: string; hash: string });

    assert.equal(entries.length, 2);
    assert.equal(entries[0].phase, "phase-02");
    assert.equal(entries[1].phase, "phase-02");
    assert.equal(entries[0].hash.length, 64);
    assert.equal(entries[1].hash.length, 64);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("synthesizePrd writes deterministic labeled artifacts", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "synthesize-prd-test-"));

  try {
    const first = await synthesizePrd({
      baseDir: tempDir,
      phase: "phase-01",
      label: "scout",
      epicId: "EPIC-1",
      epicTitle: "Scout loop",
      problemStatement: "Close readiness gaps with a research-to-PRD loop.",
      constraints: ["Keep files deterministic"],
      unknowns: ["How strict should source handling be"],
      tasks: ["Ingest sources", "Synthesize artifacts"],
      sourceRecords: [
        {
          ts: "2026-01-01T00:00:00.000Z",
          source: "docs/arbiter/brainstorm.md#problem",
          hash: "a".repeat(64),
          phase: "phase-01"
        }
      ]
    });

    const second = await synthesizePrd({
      baseDir: tempDir,
      phase: "phase-01",
      label: "scout",
      epicId: "EPIC-1",
      epicTitle: "Scout loop",
      problemStatement: "Close readiness gaps with a research-to-PRD loop.",
      constraints: ["Keep files deterministic"],
      unknowns: ["How strict should source handling be"],
      tasks: ["Ingest sources", "Synthesize artifacts"],
      sourceRecords: [
        {
          ts: "2026-01-01T00:00:00.000Z",
          source: "docs/arbiter/brainstorm.md#problem",
          hash: "a".repeat(64),
          phase: "phase-01"
        }
      ]
    });

    const firstMd = await fs.readFile(path.join(tempDir, first.prdMarkdownPath), "utf8");
    const secondMd = await fs.readFile(path.join(tempDir, second.prdMarkdownPath), "utf8");
    const firstMetadata = await fs.readFile(path.join(tempDir, first.prdMetadataPath), "utf8");
    const secondMetadata = await fs.readFile(path.join(tempDir, second.prdMetadataPath), "utf8");

    assert.equal(first.prdMarkdownPath, "docs/arbiter/reference/phase-01/PRD_scout.md");
    assert.equal(first.prdMetadataPath, "docs/arbiter/reference/phase-01/PRD_scout_metadata.json");
    assert.equal(firstMd, secondMd);
    assert.equal(firstMetadata, secondMetadata);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("runScout synthesizes PRD artifacts when canonical metadata is missing", async () => {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "scout-loop-test-"));

  try {
    process.chdir(tempDir);
    await fs.mkdir(path.join(tempDir, "docs", "arbiter"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "docs", "arbiter", "brainstorm.md"),
      [
        "## Problem",
        "- Build a scout research loop.",
        "## Constraints",
        "- Keep deterministic outputs.",
        "## Unknowns",
        "- Which source granularity to keep",
        "## Epic",
        "- Scout synthesis",
        "## Tasks",
        "- Ingest research",
        "- Generate PRD artifacts"
      ].join("\n"),
      "utf8"
    );

    const output = await runScout();
    assert.ok(output);

    const phaseDir = buildPhaseDir(tempDir);
    const metadataRaw = await fs.readFile(path.join(phaseDir, "PRD_scout_metadata.json"), "utf8");
    const metadata = JSON.parse(metadataRaw) as {
      epic: { title: string; tasks: string[] };
      summary: { problemStatement: string };
    };

    await fs.access(path.join(phaseDir, "PRD_scout.md"));
    assert.equal(metadata.summary.problemStatement, "Build a scout research loop.");
    assert.equal(metadata.epic.title, "Scout synthesis");
    assert.deepEqual(metadata.epic.tasks, ["Ingest research", "Generate PRD artifacts"]);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
