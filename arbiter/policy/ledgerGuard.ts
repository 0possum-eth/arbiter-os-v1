const normalizePath = (target: string) => target.replace(/\\/g, "/").toLowerCase();

export const isLedgerPath = (target: string) => {
  const normalized = normalizePath(target);
  return (
    normalized.includes("/docs/arbiter/_ledger/") ||
    normalized.endsWith("/docs/arbiter/_ledger") ||
    normalized.endsWith("/docs/arbiter/prd.json") ||
    normalized.endsWith("/docs/arbiter/progress.txt")
  );
};
