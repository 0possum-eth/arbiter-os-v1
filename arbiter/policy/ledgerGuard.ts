export const isLedgerPath = (target: string) =>
  target.includes("docs/arbiter/_ledger") ||
  target.endsWith("docs/arbiter/prd.json") ||
  target.endsWith("docs/arbiter/progress.txt");
