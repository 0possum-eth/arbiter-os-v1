import fs from "node:fs";
import path from "node:path";

export type InspectStateResult =
  | { status: "NO_ACTIVE_EPIC"; evidenceHealth: EvidenceHealth }
  | { status: "ACTIVE_EPIC"; epicId: string; evidenceHealth: EvidenceHealth }
  | { status: "NO_MORE_WORK"; evidenceHealth: EvidenceHealth };

type EvidenceHealth = {
  receiptContinuity: "healthy" | "missing";
  verifierEvidence: "healthy" | "missing";
  executionEvidence: "healthy" | "missing";
  canClaimFlawless: boolean;
};

type EpicRecord = {
  id?: string;
  status?: string;
  done?: boolean;
  completed?: boolean;
};

type PrdState = {
  activeEpicId?: string;
  epics?: EpicRecord[];
};

const MISSING_EVIDENCE: EvidenceHealth = {
  receiptContinuity: "missing",
  verifierEvidence: "missing",
  executionEvidence: "missing",
  canClaimFlawless: false
};

const deriveEvidenceHealth = async (rootDir: string): Promise<EvidenceHealth> => {
  const runsDir = path.join(rootDir, "docs", "arbiter", "_ledger", "runs");
  if (!fs.existsSync(runsDir)) {
    return MISSING_EVIDENCE;
  }

  const runIds = await fs.promises.readdir(runsDir).catch(() => [] as string[]);
  let latestReceiptsPath: string | null = null;
  let latestMtime = 0;

  for (const runId of runIds) {
    const receiptsPath = path.join(runsDir, runId, "receipts.jsonl");
    if (!fs.existsSync(receiptsPath)) {
      continue;
    }
    const stat = await fs.promises.stat(receiptsPath).catch(() => null);
    if (!stat) {
      continue;
    }
    const mtime = stat.mtimeMs;
    if (mtime >= latestMtime) {
      latestMtime = mtime;
      latestReceiptsPath = receiptsPath;
    }
  }

  if (!latestReceiptsPath) {
    return MISSING_EVIDENCE;
  }

  const content = await fs.promises.readFile(latestReceiptsPath, "utf8").catch(() => "");
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return MISSING_EVIDENCE;
  }

  let hasExecutor = false;
  let hasVerifierSpec = false;
  let hasVerifierQuality = false;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as { receipt?: { type?: string } };
      const type = parsed.receipt?.type;
      if (type === "EXECUTOR_COMPLETED") {
        hasExecutor = true;
      } else if (type === "VERIFIER_SPEC") {
        hasVerifierSpec = true;
      } else if (type === "VERIFIER_QUALITY") {
        hasVerifierQuality = true;
      }
    } catch {
      return MISSING_EVIDENCE;
    }
  }

  const verifierHealthy = hasVerifierSpec && hasVerifierQuality;
  const executionHealthy = hasExecutor;
  const receiptContinuity = "healthy" as const;

  return {
    receiptContinuity,
    verifierEvidence: verifierHealthy ? "healthy" : "missing",
    executionEvidence: executionHealthy ? "healthy" : "missing",
    canClaimFlawless: receiptContinuity === "healthy" && verifierHealthy && executionHealthy
  };
};

const isEpicDone = (epic: EpicRecord) => {
  if (epic.done === true || epic.completed === true) return true;
  if (!epic.status) return false;
  const normalized = epic.status.toLowerCase();
  return normalized === "done" || normalized === "completed";
};

export async function inspectState(): Promise<InspectStateResult> {
  const rootDir = process.cwd();
  const prdPath = path.join(rootDir, "docs", "arbiter", "prd.json");
  const evidenceHealth = await deriveEvidenceHealth(rootDir);

  if (!fs.existsSync(prdPath)) {
    return { status: "NO_ACTIVE_EPIC", evidenceHealth };
  }

  try {
    const raw = await fs.promises.readFile(prdPath, "utf8");
    const prdState = JSON.parse(raw) as PrdState;
    const epics = Array.isArray(prdState.epics) ? prdState.epics : [];

    if (prdState.activeEpicId) {
      const activeEpic = epics.find((epic) => epic.id === prdState.activeEpicId);
      if (activeEpic && !isEpicDone(activeEpic)) {
        return { status: "ACTIVE_EPIC", epicId: prdState.activeEpicId, evidenceHealth };
      }
    }

    if (epics.length > 0 && epics.every(isEpicDone)) {
      return { status: "NO_MORE_WORK", evidenceHealth };
    }

    return { status: "NO_ACTIVE_EPIC", evidenceHealth };
  } catch {
    return { status: "NO_ACTIVE_EPIC", evidenceHealth };
  }
}
