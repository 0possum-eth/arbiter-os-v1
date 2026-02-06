import fs from "node:fs";
import path from "node:path";

const brainstormContents = `# Brainstorm

## Problem
- Build a stable brainstorm and scout handoff.

## Constraints
- Keep outputs small and predictable.
- Only write files under docs/arbiter.

## Unknowns
- Which epic will be selected next.

## Epic
- Replace placeholder brainstorm and scout artifacts.

## Tasks
- Write a bounded brainstorm markdown file.
- Translate brainstorm bullets into a scout envelope.
- Map tasks into artifacts to touch.
`;

export async function runBrainstorm(): Promise<string> {
  const rootDir = process.cwd();
  const outputPath = path.join(rootDir, "docs", "arbiter", "brainstorm.md");
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, brainstormContents, "utf8");
  return "docs/arbiter/brainstorm.md";
}
