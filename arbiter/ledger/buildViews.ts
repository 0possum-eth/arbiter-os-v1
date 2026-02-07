import fs from "node:fs";
import path from "node:path";

import { LEDGER_SCHEMA_VERSION } from "./events";
import type { LedgerEvent } from "./events";
import { progressView } from "./progressView";

type Epic = { id: string; tasks: Array<{ id: string; done: boolean }>; done?: boolean; status?: string };

const snapshotFile = async (sourcePath: string, snapshotPath: string) => {
  await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true });
  try {
    const current = await fs.promises.readFile(sourcePath, "utf8");
    if (current.length === 0) {
      await fs.promises.appendFile(snapshotPath, "", "utf8");
      return;
    }
    const header = `--- ${new Date().toISOString()} ${path.basename(sourcePath)}`;
    const entry = `${header}\n${current.trimEnd()}\n\n`;
    await fs.promises.appendFile(snapshotPath, entry, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      await fs.promises.appendFile(snapshotPath, "", "utf8");
      return;
    }
    throw error;
  }
};

export async function buildViews(ledgerPath: string, outDir: string) {
  const content = await fs.promises.readFile(ledgerPath, "utf8");
  const parseEvent = (line: string, lineNumber: number): LedgerEvent => {
    const event = JSON.parse(line) as Partial<LedgerEvent>;
    if (event.schemaVersion !== LEDGER_SCHEMA_VERSION) {
      throw new Error(`Unsupported ledger schema version at line ${lineNumber}: ${String(event.schemaVersion)}`);
    }
    return event as LedgerEvent;
  };
  const events = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line, index) => parseEvent(line, index + 1));

  const epicMap = new Map<string, Epic>();
  let activeEpicId: string | undefined;

  for (const event of events) {
    const epicId = (event.data?.epicId as string) || "unknown";
    if (!epicMap.has(epicId)) {
      epicMap.set(epicId, { id: epicId, tasks: [] });
    }
    const epic = epicMap.get(epicId)!;
    if (event.op === "epic_selected") {
      activeEpicId = epicId;
    }
    if (event.op === "task_upsert") {
      const taskData = (event.data?.task as Record<string, unknown>) || {};
      const existing = epic.tasks.find((task) => task.id === event.id);
      if (existing) {
        Object.assign(existing, { ...taskData, id: event.id });
      } else {
        epic.tasks.push({ id: event.id, done: false, ...taskData });
      }
    }
    if (event.op === "task_done") {
      const task = epic.tasks.find((t) => t.id === event.id);
      if (task) task.done = true;
    }
  }

  for (const epic of epicMap.values()) {
    if (epic.tasks.length > 0) {
      if (epic.tasks.every((task) => task.done)) {
        epic.done = true;
        epic.status = "done";
      } else {
        epic.done = false;
      }
    }
  }

  await fs.promises.mkdir(outDir, { recursive: true });
  const prd = {
    activeEpicId,
    epics: Array.from(epicMap.values())
  };
  const prdPath = path.join(outDir, "prd.json");
  const progressPath = path.join(outDir, "progress.txt");
  const buildLogDir = path.join(outDir, "build-log");
  await snapshotFile(prdPath, path.join(buildLogDir, "prd.snapshots.log"));
  await snapshotFile(progressPath, path.join(buildLogDir, "progress.snapshots.log"));
  await fs.promises.writeFile(prdPath, `${JSON.stringify(prd, null, 2)}\n`, "utf8");
  await fs.promises.writeFile(progressPath, progressView(prd.epics), "utf8");
}
