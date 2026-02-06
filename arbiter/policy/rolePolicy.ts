import { isLedgerPath } from "./ledgerGuard";

type RoleRule = {
  writeTools: "allow" | "deny";
  writePathScope: "any" | "ledger-only";
};

export const ROLE_POLICY_TABLE: Record<string, RoleRule> = {
  arbiter: { writeTools: "allow", writePathScope: "any" },
  executor: { writeTools: "allow", writePathScope: "any" },
  electrician: { writeTools: "allow", writePathScope: "any" },
  "ux-coordinator": { writeTools: "allow", writePathScope: "any" },
  "verifier-spec": { writeTools: "deny", writePathScope: "any" },
  "verifier-quality": { writeTools: "deny", writePathScope: "any" },
  scout: { writeTools: "deny", writePathScope: "any" },
  oracle: { writeTools: "deny", writePathScope: "any" },
  librarian: { writeTools: "deny", writePathScope: "any" },
  "ledger-keeper": { writeTools: "allow", writePathScope: "ledger-only" }
};

const WRITE_TOOLS = new Set([
  "write",
  "writefile",
  "edit",
  "delete",
  "deletefile",
  "move",
  "movefile",
  "rename",
  "renamefile",
  "createfile",
  "applypatch",
  "apply_patch",
  "bash"
]);

type EvaluateRolePolicyInput = {
  role: string;
  toolName?: string;
  targets: string[];
};

type EvaluateRolePolicyResult = {
  allowed: boolean;
  reason?: string;
};

const normalize = (value: string | undefined) => (value || "").trim().toLowerCase();

const isLedgerOrViewPath = (target: string) => {
  const normalized = normalize(target).replace(/\\/g, "/");
  return isLedgerPath(`/${normalized}`) || isLedgerPath(normalized);
};

const isWriteTool = (toolName: string | undefined) => WRITE_TOOLS.has(normalize(toolName));

export const evaluateRolePolicy = ({ role, toolName, targets }: EvaluateRolePolicyInput): EvaluateRolePolicyResult => {
  if (!isWriteTool(toolName)) {
    return { allowed: true };
  }

  const normalizedRole = normalize(role);
  const rule = ROLE_POLICY_TABLE[normalizedRole];

  if (!rule) {
    return {
      allowed: false,
      reason: `Unknown role ${normalizedRole || "unknown"} cannot execute write tool ${toolName || "unknown"}`
    };
  }

  if (targets.length === 0) {
    return {
      allowed: false,
      reason: `Write tool ${toolName || "unknown"} requires explicit target paths`
    };
  }

  if (targets.some((target) => isLedgerOrViewPath(target)) && normalizedRole !== "ledger-keeper") {
    return { allowed: false, reason: "Ledger writes must go through Ledger Keeper" };
  }

  if (rule.writeTools === "deny") {
    return {
      allowed: false,
      reason: `Read-only role ${normalizedRole} cannot execute write tool ${toolName || "unknown"}`
    };
  }

  if (rule.writePathScope === "ledger-only") {
    if (targets.length === 0 || targets.some((target) => !isLedgerOrViewPath(target))) {
      return {
        allowed: false,
        reason: "Ledger-keeper can only write within docs/arbiter/_ledger, prd.json, and progress.txt"
      };
    }
  }

  return { allowed: true };
};
