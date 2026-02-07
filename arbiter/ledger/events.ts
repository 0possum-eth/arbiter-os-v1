export const LEDGER_SCHEMA_VERSION = "arbiter.ledger.v1";

export type LedgerEvent = {
  schemaVersion: typeof LEDGER_SCHEMA_VERSION;
  ts: string;
  op: "task_upsert" | "task_done" | "epic_selected";
  id: string;
  data?: Record<string, unknown>;
};
