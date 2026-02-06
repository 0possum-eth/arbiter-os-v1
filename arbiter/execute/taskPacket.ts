import { contextPack } from "../librarian/contextPack";

export type TaskPacket = {
  taskId: string;
  contextPack: string;
  citations: string[];
  query: string;
};

type TaskPacketInput = {
  id?: string;
  query?: string;
};

const extractCitations = (pack: string) => {
  const citations: string[] = [];
  for (const line of pack.split("\n")) {
    if (!line.startsWith("- [")) continue;
    const end = line.indexOf("]");
    if (end === -1) continue;
    const citation = line.slice(3, end).trim();
    if (citation.length > 0) {
      citations.push(citation);
    }
  }
  return citations;
};

export async function buildTaskPacket(task: TaskPacketInput): Promise<TaskPacket> {
  const taskId =
    typeof task.id === "string" && task.id.trim().length === 0
      ? "UNKNOWN_TASK"
      : task.id ?? "UNKNOWN_TASK";
  const query = task.query && task.query.trim().length > 0 ? task.query : taskId;
  let pack = "## Context Pack";
  try {
    pack = await contextPack(query);
  } catch {
    pack = "## Context Pack";
  }

  return {
    taskId,
    contextPack: pack,
    citations: extractCitations(pack),
    query
  };
}
