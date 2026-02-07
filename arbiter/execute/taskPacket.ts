import { contextPack } from "../librarian/contextPack";

export type TaskPacket = {
  taskId: string;
  contextPack: string;
  citations: string[];
  query: string;
  strategyCommands?: StrategyCommand[];
};

export type StrategyCommand = {
  command: string;
  args?: string[];
};

type TaskPacketInput = {
  id?: string;
  query?: string;
  strategyCommands?: unknown;
};

export const normalizeStrategyCommands = (value: unknown): StrategyCommand[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const commands: StrategyCommand[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const command = typeof record.command === "string" ? record.command.trim() : "";
    if (command.length === 0) {
      continue;
    }
    const args = Array.isArray(record.args)
      ? record.args.filter((arg): arg is string => typeof arg === "string")
      : undefined;
    commands.push(args && args.length > 0 ? { command, args } : { command });
  }

  return commands.length > 0 ? commands : undefined;
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
  const strategyCommands = normalizeStrategyCommands(task.strategyCommands);
  try {
    pack = await contextPack(query, { capProfile: "extended", includeSourceIds: true });
  } catch {
    pack = "## Context Pack";
  }

  return {
    taskId,
    contextPack: pack,
    citations: extractCitations(pack),
    query,
    ...(strategyCommands ? { strategyCommands } : {})
  };
}
