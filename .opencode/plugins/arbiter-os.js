import fs from "node:fs";
import path from "node:path";

import { isLedgerPath } from "../../arbiter/policy/ledgerGuard";
import { getRoleFromEnv } from "../../arbiter/policy/roleContext";

const extractTargets = (input) => {
  const args = input?.args;
  if (!args) return [];
  if (typeof args.path === "string") return [args.path];
  if (Array.isArray(args.paths)) return args.paths.filter((item) => typeof item === "string");
  if (Array.isArray(args.files)) return args.files.filter((item) => typeof item === "string");
  return [];
};

const isEpicIncomplete = () => {
  const prdPath = path.join(process.cwd(), "docs", "arbiter", "prd.json");
  if (!fs.existsSync(prdPath)) return false;
  try {
    const raw = fs.readFileSync(prdPath, "utf8");
    const state = JSON.parse(raw);
    const epics = Array.isArray(state.epics) ? state.epics : [];
    if (!state.activeEpicId) return false;
    const active = epics.find((epic) => epic.id === state.activeEpicId);
    return active && active.done !== true;
  } catch {
    return true;
  }
};

export const ArbiterOsPlugin = async () => ({
  "experimental.chat.system.transform": async (_input, output) => {
    (output.system ||= []).push(
      "You are running Arbiter OS. Use run-epic as the canonical entrypoint."
    );
  },
  "tool.execute.before": async (input) => {
    const targets = extractTargets(input);
    if (targets.some((target) => isLedgerPath(target))) {
      const role = getRoleFromEnv();
      if (role !== "ledger-keeper") {
        throw new Error("Ledger writes must go through Ledger Keeper");
      }
    }
  },
  "experimental.session.compacting": async () => ({
    summary: "Arbiter OS active: run-epic coordinator enabled"
  }),
  stop: async () => {
    if (isEpicIncomplete()) {
      throw new Error("Epic incomplete: cannot stop");
    }
    return { reason: "Arbiter OS stop hook enabled" };
  }
});
