import type { MemoryEntry, MemoryScope } from "./store";

type MemoryPolicyInput = {
  now: string;
  entries: MemoryEntry[];
  staleAfterDays?: number;
  promotionThreshold?: number;
};

const PROMOTION_SCOPE: Record<MemoryScope, MemoryScope> = {
  session: "project",
  project: "personal",
  personal: "personal"
};

const DECAY_SCOPE: Record<MemoryScope, MemoryScope> = {
  session: "session",
  project: "session",
  personal: "project"
};

const readSalience = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return 0;
  }
  const salience = (data as { salience?: unknown }).salience;
  if (typeof salience !== "number" || Number.isNaN(salience)) {
    return 0;
  }
  return Math.min(Math.max(salience, 0), 1);
};

export function applyMemoryPolicy({
  now,
  entries,
  staleAfterDays = 30,
  promotionThreshold = 0.8
}: MemoryPolicyInput): MemoryEntry[] {
  const nowMs = Date.parse(now);
  const staleWindowMs = staleAfterDays * 24 * 60 * 60 * 1000;

  return entries.map((entry) => {
    let nextScope = entry.scope;
    const tsMs = Date.parse(entry.ts);
    const stale = Number.isFinite(nowMs) && Number.isFinite(tsMs) ? nowMs - tsMs > staleWindowMs : false;
    if (stale) {
      nextScope = DECAY_SCOPE[nextScope];
    }

    const salience = readSalience(entry.data);
    if (salience >= promotionThreshold) {
      nextScope = PROMOTION_SCOPE[nextScope];
    }

    if (nextScope === entry.scope) {
      return entry;
    }

    return {
      ...entry,
      scope: nextScope
    };
  });
}
