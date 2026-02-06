const isLedgerPath = (target) =>
  typeof target === "string" &&
  (target.includes("docs/arbiter/_ledger") ||
    target.endsWith("docs/arbiter/prd.json") ||
    target.endsWith("docs/arbiter/progress.txt"));

export const ArbiterOsPlugin = async () => ({
  "experimental.chat.system.transform": async (_input, output) => {
    (output.system ||= []).push(
      "You are running Arbiter OS. Use run-epic as the canonical entrypoint."
    );
  },
  "tool.execute.before": async (input) => {
    const target = input?.args?.path;
    if (isLedgerPath(target)) {
      throw new Error("Ledger writes must go through Ledger Keeper");
    }
  },
  stop: async () => ({
    reason: "Arbiter OS stop hook enabled"
  })
});
