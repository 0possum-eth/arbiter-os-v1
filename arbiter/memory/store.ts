import fs from "node:fs";
import path from "node:path";

export const MEMORY_SCOPES = ["session", "project", "personal"] as const;

export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export type MemoryEntry = {
  scope: MemoryScope;
  ts: string;
  data: unknown;
};

const MEMORY_FILENAMES: Record<MemoryScope, string> = {
  session: "session.jsonl",
  project: "project.jsonl",
  personal: "personal.jsonl"
};

type MemoryOptions = {
  cwd?: string;
};

type MemoryWriteOptions = MemoryOptions & {
  ts?: string;
};

function resolveMemoryDir(cwd: string): string {
  return path.join(cwd, "docs", "arbiter", "_memory");
}

export function resolveMemoryPath(scope: MemoryScope, options: MemoryOptions = {}): string {
  const cwd = options.cwd ?? process.cwd();
  return path.join(resolveMemoryDir(cwd), MEMORY_FILENAMES[scope]);
}

export async function writeMemoryEntry(
  scope: MemoryScope,
  data: unknown,
  options: MemoryWriteOptions = {}
): Promise<MemoryEntry> {
  const normalizedData = data === undefined ? null : data;
  const entry: MemoryEntry = {
    scope,
    ts: options.ts ?? new Date().toISOString(),
    data: normalizedData
  };
  const memoryPath = resolveMemoryPath(scope, options);
  await fs.promises.mkdir(path.dirname(memoryPath), { recursive: true });
  await fs.promises.appendFile(memoryPath, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

export async function readMemoryEntries(
  scope: MemoryScope,
  options: MemoryOptions = {}
): Promise<MemoryEntry[]> {
  const memoryPath = resolveMemoryPath(scope, options);
  let content = "";
  try {
    content = await fs.promises.readFile(memoryPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const entries: MemoryEntry[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Partial<MemoryEntry>;
      if (parsed.scope !== scope || typeof parsed.ts !== "string") {
        continue;
      }
      entries.push({
        scope,
        ts: parsed.ts,
        data: parsed.data
      });
    } catch {
      continue;
    }
  }

  return entries;
}

export async function readLatestMemoryByScope(
  options: MemoryOptions = {}
): Promise<Partial<Record<MemoryScope, MemoryEntry>>> {
  const latest: Partial<Record<MemoryScope, MemoryEntry>> = {};
  for (const scope of MEMORY_SCOPES) {
    const entries = await readMemoryEntries(scope, options);
    if (entries.length > 0) {
      latest[scope] = entries[entries.length - 1];
    }
  }
  return latest;
}
