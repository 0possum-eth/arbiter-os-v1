import fs from "node:fs";
import path from "node:path";

import { getRoleFromEnv } from "../../arbiter/policy/roleContext";
import { evaluateRolePolicy } from "../../arbiter/policy/rolePolicy";
import { extractToolTargets } from "../../arbiter/policy/toolTargets";
import { isTrusted } from "../../arbiter/trust/commands";
import { canMountForExecution, classifyBrick } from "../../arbiter/trust/policy";
import { buildCompactionSummary } from "../../arbiter/memory/compactSummary";

const normalizeDocPath = (docPath) => docPath.trim().replace(/\\/g, "/");

const toMountedDoc = (value) => {
  if (typeof value === "string") {
    return { path: value };
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const pathValue = [value.packPath, value.path, value.docPath, value.doc, value.contextDoc].find(
    (item) => typeof item === "string"
  );
  if (typeof pathValue !== "string") {
    return null;
  }
  const sourcePath = [value.sourcePath, value.sourceDocPath].find(
    (item) => typeof item === "string"
  );
  return typeof sourcePath === "string" ? { path: pathValue, sourcePath } : { path: pathValue };
};

const extractMountedDocs = (input) => {
  const args = input?.args;
  if (!args) return [];
  const docs = [];
  const singleValues = [args.doc, args.docPath, args.contextDoc];
  for (const value of singleValues) {
    const doc = toMountedDoc(value);
    if (doc) docs.push(doc);
  }
  if (Array.isArray(args.docs)) docs.push(...args.docs.map((item) => toMountedDoc(item)).filter(Boolean));
  if (Array.isArray(args.docPaths)) {
    docs.push(...args.docPaths.map((item) => toMountedDoc(item)).filter(Boolean));
  }
  if (Array.isArray(args.mountedDocs)) {
    docs.push(...args.mountedDocs.map((item) => toMountedDoc(item)).filter(Boolean));
  }
  if (Array.isArray(args.contextDocs)) {
    docs.push(...args.contextDocs.map((item) => toMountedDoc(item)).filter(Boolean));
  }
  if (Array.isArray(args.mounts)) {
    docs.push(...args.mounts.map((item) => toMountedDoc(item)).filter(Boolean));
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
    let targets = [];
    let targetExtractionError;
    try {
      targets = extractToolTargets(input?.name, input?.args);
    } catch (error) {
      targetExtractionError = error instanceof Error ? error.message : "Target extraction failed";
    }
    const role = getRoleFromEnv();
    const roleDecision = evaluateRolePolicy({
      role,
      toolName: input?.name,
      targets,
      targetExtractionError
    });
    if (!roleDecision.allowed) {
      throw new Error(roleDecision.reason || "Role policy denied tool execution");
    }

    const mountedDocs = extractMountedDocs(input);
    if (mountedDocs.length > 0) {
      const blocked = [];
      for (const mountedDoc of mountedDocs) {
        const policyPath = normalizeDocPath(mountedDoc.sourcePath ?? mountedDoc.path);
        const trusted = await isTrusted(policyPath);
        const brickType = classifyBrick(policyPath);
        const allowed =
          brickType === "knowledge" ? true : canMountForExecution(policyPath, trusted);
        if (!allowed) {
          blocked.push(mountedDoc.path);
        }
      }
      if (blocked.length > 0) {
        throw new Error(`Untrusted docs mounted: ${blocked.join(", ")}`);
      }
    }
  },
  "experimental.session.compacting": async () => ({
    summary: await buildCompactionSummary()
  }),
  stop: async () => {
    if (isEpicIncomplete()) {
      throw new Error("Epic incomplete: cannot stop");
    }
    return { reason: "Arbiter OS stop hook enabled" };
  }
});
