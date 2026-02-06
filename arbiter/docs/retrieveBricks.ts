import fs from "node:fs";

type Brick = {
  path: string;
  heading: string;
  content: string;
};

const score = (brick: Brick, terms: string[]) => {
  const haystack = `${brick.heading} ${brick.content}`.toLowerCase();
  return terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
};

export async function retrieveBricks(indexPath: string, query: string, limit = 3) {
  const content = await fs.promises.readFile(indexPath, "utf8");
  const bricks = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Brick);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const ranked = bricks
    .map((brick) => ({ brick, score: score(brick, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.brick);

  return ranked;
}
