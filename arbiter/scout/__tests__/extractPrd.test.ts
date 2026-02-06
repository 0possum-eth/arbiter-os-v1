import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { extractPrd } from "../extractPrd";

test("extractPrd maps PRD metadata to scout envelope", async () => {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "extract-prd-test-"));

  try {
    process.chdir(tempDir);

    const prdDir = path.join(tempDir, "docs", "arbiter", "reference", "phase-01");
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

    const output = await extractPrd();
    assert.ok(output);

    const scout = output as {
      summary: { problemStatement: string };
      candidates: Array<{ title: string; artifactsToTouch: string[]; scope: { included: string[] } }>;
      recommendation: { candidateId: string };
    };

    assert.equal(scout.summary.problemStatement, metadata.summary.problemStatement);
    assert.equal(scout.candidates[0].title, metadata.epic.title);
    assert.deepEqual(scout.candidates[0].artifactsToTouch, metadata.epic.tasks);
    assert.deepEqual(scout.candidates[0].scope.included, metadata.epic.tasks);
    assert.equal(scout.recommendation.candidateId, metadata.epic.id);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
