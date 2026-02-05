import fs from "node:fs";
import path from "node:path";

import type { LedgerEvent } from "./events";

export async function appendEvent(ledgerPath: string, event: LedgerEvent) {
  const dir = path.dirname(ledgerPath);
  await fs.promises.mkdir(dir, { recursive: true });
  const line = `${JSON.stringify(event)}\n`;
  await fs.promises.appendFile(ledgerPath, line, "utf8");
}
