import fs from "node:fs";
import path from "node:path";

type Brick = {
  path: string;
  heading: string;
  content: string;
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

export async function indexBricks(sourceDir: string, indexPath: string) {
  const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
  const bricks: Brick[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(sourceDir, entry.name);
    const raw = await fs.promises.readFile(filePath, "utf8");
    const chunks = splitByHeading(raw);
    for (const chunk of chunks) {
      if (!chunk.content) continue;
      bricks.push({ path: filePath, heading: chunk.heading, content: chunk.content });
    }
  }

  await fs.promises.mkdir(path.dirname(indexPath), { recursive: true });
  const jsonl = bricks.map((brick) => JSON.stringify(brick)).join("\n") + (bricks.length ? "\n" : "");
  await fs.promises.writeFile(indexPath, jsonl, "utf8");
}
