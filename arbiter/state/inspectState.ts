import fs from "node:fs";
import path from "node:path";

export type InspectStateResult =
  | { status: "NO_ACTIVE_EPIC" }
  | { status: "ACTIVE_EPIC"; epicId: string }
  | { status: "NO_MORE_WORK" };

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

const isEpicDone = (epic: EpicRecord) => {
  if (epic.done === true || epic.completed === true) return true;
  if (!epic.status) return false;
  const normalized = epic.status.toLowerCase();
  return normalized === "done" || normalized === "completed";
};

export async function inspectState(): Promise<InspectStateResult> {
  const rootDir = process.cwd();
  const prdPath = path.join(rootDir, "docs", "arbiter", "prd.json");

  if (!fs.existsSync(prdPath)) {
    return { status: "NO_ACTIVE_EPIC" };
  }

  try {
    const raw = await fs.promises.readFile(prdPath, "utf8");
    const prdState = JSON.parse(raw) as PrdState;
    const epics = Array.isArray(prdState.epics) ? prdState.epics : [];

    if (prdState.activeEpicId) {
      const activeEpic = epics.find((epic) => epic.id === prdState.activeEpicId);
      if (activeEpic && !isEpicDone(activeEpic)) {
        return { status: "ACTIVE_EPIC", epicId: prdState.activeEpicId };
      }
    }

    if (epics.length > 0 && epics.every(isEpicDone)) {
      return { status: "NO_MORE_WORK" };
    }

    return { status: "NO_ACTIVE_EPIC" };
  } catch {
    return { status: "NO_ACTIVE_EPIC" };
  }
}
