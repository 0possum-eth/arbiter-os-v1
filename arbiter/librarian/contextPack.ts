import path from "node:path";

import { retrieveBricks } from "../docs/retrieveBricks";

const getIndexPath = () => {
  const envPath = process.env.ARBITER_DOCS_INDEX_PATH;
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(envPath);
  }
  return path.join(process.cwd(), "docs", "arbiter", "_ledger", "bricks.jsonl");
};

const normalizeHeading = (heading: string) => {
  const normalized = heading.replace(/^#+\s*/, "").trim();
  return normalized || heading.trim();
};

const normalizePath = (filePath: string) => filePath.replace(/\\/g, "/");

export async function contextPack(query: string) {
  const indexPath = getIndexPath();
  const bricks = await retrieveBricks(indexPath, query, 2);
  const lines = bricks.map((brick) => {
    const heading = normalizeHeading(brick.heading);
    const source = `${normalizePath(brick.path)}#${heading}`;
    return `- [${source}] ${brick.content}`;
  });

  return ["## Context Pack", ...lines].join("\n");
}
