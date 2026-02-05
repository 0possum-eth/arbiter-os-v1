import path from "node:path";

import { appendEvent } from "../ledger/appendEvent";
import { buildViews } from "../ledger/buildViews";

type EpicActivation = {
  id: string;
  tasks: Array<{ id: string; noop?: boolean }>;
};

export async function activateEpic(ledgerPath: string, epic: EpicActivation) {
  const now = new Date().toISOString();
  await appendEvent(ledgerPath, {
    ts: now,
    op: "epic_selected",
    id: epic.id,
    data: { epicId: epic.id }
  });

  for (const task of epic.tasks) {
    await appendEvent(ledgerPath, {
      ts: now,
      op: "task_upsert",
      id: task.id,
      data: { epicId: epic.id, task: { noop: task.noop } }
    });
  }

  const outDir = path.resolve(path.dirname(ledgerPath), "..");
  await buildViews(ledgerPath, outDir);
}
