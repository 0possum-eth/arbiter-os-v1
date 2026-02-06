import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const arbiterDir = path.join(rootDir, "docs", "arbiter");

const ensureDir = async (dir: string) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const ensureFile = async (filePath: string, content = "") => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, "utf8");
};

await ensureDir(path.join(arbiterDir, "reference", "_inbox"));
await ensureDir(path.join(arbiterDir, "_ledger"));
await ensureDir(path.join(arbiterDir, "build-log"));

await ensureFile(path.join(arbiterDir, "prd.json"), "{}\n");
await ensureFile(path.join(arbiterDir, "progress.txt"), "");
await ensureFile(path.join(arbiterDir, "_ledger", "prd.events.jsonl"), "");
await ensureFile(path.join(arbiterDir, "_ledger", "receipts", "receipts.jsonl"), "");
