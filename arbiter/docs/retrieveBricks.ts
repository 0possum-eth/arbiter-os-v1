import fs from "node:fs";

import { rankBricks, type IndexedBrick } from "./retrievalScoring";

export async function retrieveBricks(indexPath: string, query: string, limit = 3) {
  const content = await fs.promises.readFile(indexPath, "utf8");
  const bricks = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as IndexedBrick);

  return rankBricks(bricks, query, limit);
}
