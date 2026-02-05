import fs from "node:fs";
import path from "node:path";

import type { LedgerEvent } from "./events";

type Epic = { id: string; tasks: Array<{ id: string; done: boolean }> };

export async function buildViews(ledgerPath: string, outDir: string) {
  const content = await fs.promises.readFile(ledgerPath, "utf8");
  const events = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LedgerEvent);

  const epicMap = new Map<string, Epic>();

  for (const event of events) {
    const epicId = (event.data?.epicId as string) || "unknown";
    if (!epicMap.has(epicId)) {
      epicMap.set(epicId, { id: epicId, tasks: [] });
    }
    const epic = epicMap.get(epicId)!;
    if (event.op === "task_upsert") {
      if (!epic.tasks.find((task) => task.id === event.id)) {
        epic.tasks.push({ id: event.id, done: false });
      }
    }
    if (event.op === "task_done") {
      const task = epic.tasks.find((t) => t.id === event.id);
      if (task) task.done = true;
    }
  }

  await fs.promises.mkdir(outDir, { recursive: true });
  const prd = { epics: Array.from(epicMap.values()) };
  await fs.promises.writeFile(path.join(outDir, "prd.json"), `${JSON.stringify(prd, null, 2)}\n`, "utf8");
}
