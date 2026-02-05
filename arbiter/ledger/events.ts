export type LedgerEvent = {
  ts: string;
  op: "task_upsert" | "task_done" | "epic_selected";
  id: string;
  data?: Record<string, unknown>;
};
