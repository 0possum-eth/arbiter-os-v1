import fs from "node:fs";
import path from "node:path";

export type RunEvent = {
  ts: string;
  op: "run_started" | "run_updated";
  runId: string;
  data?: Record<string, unknown>;
};

const ensureRunMeta = async (metaPath: string, runId: string, ts: string) => {
  await fs.promises.mkdir(path.dirname(metaPath), { recursive: true });
  const meta = { runId, startedAt: ts };

  try {
    await fs.promises.writeFile(metaPath, `${JSON.stringify(meta)}\n`, {
      encoding: "utf8",
      flag: "wx"
    });
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "EEXIST") return false;
    throw error;
  }
};

export async function appendRunEvent(ledgerPath: string, event: RunEvent) {
  const dir = path.dirname(ledgerPath);
  await fs.promises.mkdir(dir, { recursive: true });
  const line = `${JSON.stringify(event)}\n`;
  await fs.promises.appendFile(ledgerPath, line, "utf8");
}

export async function recordRunUpdate(
  ledgerPath: string,
  runId: string,
  data?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  const metaPath = path.join(path.dirname(ledgerPath), "runs", runId, "meta.json");
  const isNewRun = await ensureRunMeta(metaPath, runId, ts);

  if (isNewRun) {
    await appendRunEvent(ledgerPath, { ts, op: "run_started", runId, data });
  }

  await appendRunEvent(ledgerPath, { ts, op: "run_updated", runId, data });
}
