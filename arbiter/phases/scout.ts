import fs from "node:fs";
import path from "node:path";

import { getRunId } from "../receipts/runContext";
import { extractPrd } from "../scout/extractPrd";

const readBullets = (lines: string[], header: string) => {
  const headerLine = `## ${header}`;
  const startIndex = lines.findIndex((line) => line.trim() === headerLine);
  if (startIndex === -1) return [] as string[];

  const bullets: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("## ")) break;
    if (line.startsWith("- ")) bullets.push(line.slice(2).trim());
  }
  return bullets;
};

export async function runScout(): Promise<unknown> {
  const prdOutput = await extractPrd();
  if (prdOutput) return prdOutput;

  const rootDir = process.cwd();
  const brainstormPath = path.join(rootDir, "docs", "arbiter", "brainstorm.md");
  let contents: string;
  try {
    contents = await fs.promises.readFile(brainstormPath, "utf8");
  } catch (error) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      throw new Error(`Brainstorm file not found at ${brainstormPath}`);
    }
    throw error;
  }
  const lines = contents.split("\n");

  const problem = readBullets(lines, "Problem")[0] ?? "Define the next epic.";
  const constraints = readBullets(lines, "Constraints");
  const unknowns = readBullets(lines, "Unknowns");
  const epicTitle = readBullets(lines, "Epic")[0] ?? "Untitled epic";
  const tasks = readBullets(lines, "Tasks");
  const artifactsToTouch = tasks.length > 0 ? tasks : ["docs/arbiter/brainstorm.md"];
  const scopeIncluded = tasks.length > 0 ? tasks : ["docs/arbiter"];
  const constraintsWithTasks = tasks.length > 0
    ? constraints.concat(tasks.map((task) => `task:${task}`))
    : constraints;

  return {
    schemaVersion: "arbiter.scout.v1",
    metadata: {
      runId: getRunId(),
      scoutId: `scout-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      confidence: "low"
    },
    summary: {
      problemStatement: problem,
      constraints: constraintsWithTasks,
      unknowns
    },
    candidates: [
      {
        id: "EPIC-1",
        title: epicTitle,
        intent: problem,
        scope: {
          included: scopeIncluded,
          excluded: []
        },
        prerequisites: [],
        estimatedComplexity: "low",
        artifactsToTouch,
        risks: [],
        disallowedActions: []
      }
    ],
    recommendation: {
      candidateId: "EPIC-1",
      rationale: "Derived from brainstorm bullets"
    }
  };
}
