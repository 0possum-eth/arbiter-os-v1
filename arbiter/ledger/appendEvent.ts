import fs from "node:fs";
import path from "node:path";

import { LEDGER_SCHEMA_VERSION } from "./events";
import type { LedgerEvent } from "./events";

type AppendLedgerEvent = Omit<LedgerEvent, "schemaVersion"> & Partial<Pick<LedgerEvent, "schemaVersion">>;

export async function appendEvent(ledgerPath: string, event: AppendLedgerEvent) {
  const dir = path.dirname(ledgerPath);
  await fs.promises.mkdir(dir, { recursive: true });
  const versionedEvent: LedgerEvent = {
    ...event,
    schemaVersion: LEDGER_SCHEMA_VERSION
  };
  const line = `${JSON.stringify(versionedEvent)}\n`;
  await fs.promises.appendFile(ledgerPath, line, "utf8");
}
