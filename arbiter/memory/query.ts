import { tokenize } from "../docs/retrievalScoring";
import { readMemoryEntries, type MemoryEntry, type MemoryScope } from "./store";

type QueryMemoryInput = {
  scope: MemoryScope;
  query: string;
  limit?: number;
  cwd?: string;
};

const scoreEntry = (entry: MemoryEntry, queryTerms: Set<string>) => {
  const haystack = tokenize(JSON.stringify(entry.data ?? ""));
  const haystackSet = new Set(haystack);
  let hits = 0;
  for (const term of queryTerms) {
    if (haystackSet.has(term)) {
      hits += 1;
    }
  }
  return hits;
};

export async function queryMemory({ scope, query, limit = 3, cwd }: QueryMemoryInput): Promise<MemoryEntry[]> {
  const entries = await readMemoryEntries(scope, cwd ? { cwd } : undefined);
  if (entries.length === 0 || limit <= 0) {
    return [];
  }

  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) {
    return entries.slice(-limit);
  }

  const scored = entries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, queryTerms)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.entry.ts.localeCompare(left.entry.ts);
    })
    .slice(0, limit)
    .map((item) => item.entry);

  return scored;
}
