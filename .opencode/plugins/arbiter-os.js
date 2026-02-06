import fs from "node:fs";
import path from "node:path";

import { isLedgerPath } from "../../arbiter/policy/ledgerGuard";
import { getRoleFromEnv } from "../../arbiter/policy/roleContext";
import { isTrusted } from "../../arbiter/trust/commands";

const extractTargets = (input) => {
  const args = input?.args;
  if (!args) return [];
  if (typeof args.path === "string") return [args.path];
  if (Array.isArray(args.paths)) return args.paths.filter((item) => typeof item === "string");
  if (Array.isArray(args.files)) return args.files.filter((item) => typeof item === "string");
  return [];
};

const getToolName = (input) => {
  if (typeof input?.name === "string") return input.name;
  if (typeof input?.tool === "string") return input.tool;
  if (typeof input?.tool?.name === "string") return input.tool.name;
  return null;
};

const extractMountedDocs = (input) => {
  const args = input?.args;
  if (!args) return [];
  const docs = [];
  if (typeof args.doc === "string") docs.push(args.doc);
  if (typeof args.docPath === "string") docs.push(args.docPath);
  if (typeof args.contextDoc === "string") docs.push(args.contextDoc);
  if (Array.isArray(args.docs)) docs.push(...args.docs.filter((item) => typeof item === "string"));
  if (Array.isArray(args.docPaths)) {
    docs.push(...args.docPaths.filter((item) => typeof item === "string"));
  }
  if (Array.isArray(args.mountedDocs)) {
    docs.push(...args.mountedDocs.filter((item) => typeof item === "string"));
  }
  if (Array.isArray(args.contextDocs)) {
    docs.push(...args.contextDocs.filter((item) => typeof item === "string"));
  }
  if (Array.isArray(args.mounts)) {
    docs.push(...args.mounts.filter((item) => typeof item === "string"));
  }
  return docs;
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

    if (getToolName(input) === "runTask") {
      const mountedDocs = extractMountedDocs(input);
      if (mountedDocs.length > 0) {
        const untrusted = [];
        for (const docPath of mountedDocs) {
          if (!(await isTrusted(docPath))) {
            untrusted.push(docPath);
          }
        }
        if (untrusted.length > 0) {
          throw new Error(`Untrusted docs mounted: ${untrusted.join(", ")}`);
        }
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
