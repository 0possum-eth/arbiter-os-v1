import fs from "node:fs";
import path from "node:path";

export async function ingestDoc(srcPath: string, rootDir: string) {
  const inbox = path.join(rootDir, "docs", "arbiter", "reference", "_inbox");
  await fs.promises.mkdir(inbox, { recursive: true });
  const destPath = path.join(inbox, path.basename(srcPath));
  await fs.promises.copyFile(srcPath, destPath);
  return { destPath, trusted: false };
}
