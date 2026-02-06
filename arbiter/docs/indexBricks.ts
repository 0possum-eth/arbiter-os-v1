import fs from "node:fs";
import path from "node:path";

import { tokenize } from "./retrievalScoring";

type Brick = {
  path: string;
  heading: string;
  content: string;
  pathTerms: string[];
  headingTerms: string[];
  contentTerms: string[];
};

const splitByHeading = (content: string) => {
  const lines = content.split("\n");
  const chunks: Array<{ heading: string; content: string[] }> = [];
  let current = { heading: "", content: [] as string[] };

  for (const line of lines) {
    if (line.startsWith("#")) {
      if (current.content.length > 0 || current.heading) {
        chunks.push(current);
      }
      current = { heading: line.trim(), content: [] };
      continue;
    }
    current.content.push(line);
  }

  if (current.content.length > 0 || current.heading) {
    chunks.push(current);
  }

  return chunks.map((chunk) => ({
    heading: chunk.heading || "(no heading)",
    content: chunk.content.join("\n").trim()
  }));
};

const collectFiles = async (rootDir: string): Promise<string[]> => {
  const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  const sortedEntries = entries.sort((left, right) => left.name.localeCompare(right.name));
  const files: string[] = [];

  for (const entry of sortedEntries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

export async function indexBricks(sourceDir: string, indexPath: string) {
  const filePaths = await collectFiles(sourceDir);
  const bricks: Brick[] = [];

  for (const filePath of filePaths) {
    const raw = await fs.promises.readFile(filePath, "utf8");
    const chunks = splitByHeading(raw);
    const pathTerms = tokenize(filePath);
    for (const chunk of chunks) {
      if (!chunk.content) continue;
      bricks.push({
        path: filePath,
        heading: chunk.heading,
        content: chunk.content,
        pathTerms,
        headingTerms: tokenize(chunk.heading),
        contentTerms: tokenize(chunk.content)
      });
    }
  }

  await fs.promises.mkdir(path.dirname(indexPath), { recursive: true });
  const jsonl = bricks.map((brick) => JSON.stringify(brick)).join("\n") + (bricks.length ? "\n" : "");
  await fs.promises.writeFile(indexPath, jsonl, "utf8");
}
