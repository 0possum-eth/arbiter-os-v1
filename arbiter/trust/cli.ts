import fs from "node:fs";
import path from "node:path";

import { approveDoc, isTrusted } from "./commands";
import { canMountForExecution, classifyBrick } from "./policy";
import { contextPack } from "../librarian/contextPack";

type BrickEntry = {
  path: string;
  heading: string;
  content: string;
};

const getIndexPath = () => {
  const envPath = process.env.ARBITER_DOCS_INDEX_PATH;
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(envPath);
  }
  return path.join(process.cwd(), "docs", "arbiter", "_ledger", "bricks.jsonl");
};

const normalizeDocPath = (docPath: string) => docPath.trim().replace(/\\/g, "/");

const normalizeHeading = (heading: string) => {
  const normalized = heading.replace(/^#+\s*/, "").trim();
  return normalized || heading.trim();
};

export async function approveBrick(docPath: string): Promise<string> {
  const normalizedPath = normalizeDocPath(docPath);
  await approveDoc(normalizedPath);
  return normalizedPath;
}

export type MountDocResult = {
  packPath: string;
  sourcePath: string;
  brickType: "knowledge" | "behavior";
  trusted: boolean;
};

export async function mountDoc(docPath: string): Promise<MountDocResult> {
  const normalizedPath = normalizeDocPath(docPath);
  const resolvedDocPath = path.resolve(normalizedPath);
  const trusted = await isTrusted(normalizedPath);
  const brickType = classifyBrick(normalizedPath);
  if (!canMountForExecution(normalizedPath, trusted)) {
    throw new Error(`Doc not trusted: ${normalizedPath}`);
  }
  const packDir = path.join(process.cwd(), "docs", "arbiter", "context-packs");
  await fs.promises.mkdir(packDir, { recursive: true });

  const docContent = await fs.promises.readFile(resolvedDocPath, "utf8");
  const packContent = await contextPack(docContent);
  const packName = `context-pack-${Date.now()}-${Math.random().toString(16).slice(2)}.md`;
  const packPath = path.join(packDir, packName);
  await fs.promises.writeFile(packPath, packContent, "utf8");

  return {
    packPath: normalizeDocPath(packPath),
    sourcePath: normalizedPath,
    brickType,
    trusted
  };
}

export async function listBricks(): Promise<string[]> {
  const indexPath = getIndexPath();
  try {
    const raw = await fs.promises.readFile(indexPath, "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as BrickEntry)
      .map((brick) => `${normalizeDocPath(brick.path)}#${normalizeHeading(brick.heading)}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}
