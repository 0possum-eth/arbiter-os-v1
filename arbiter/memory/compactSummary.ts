import { MEMORY_SCOPES, readAllMemoryEntries, readLatestMemoryByScope, rewriteMemoryEntries } from "./store";
import { applyMemoryPolicy } from "./policy";

const FALLBACK_SUMMARY = "Arbiter OS active: run-epic coordinator enabled";

function stableStringify(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "undefined";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(",")}}`;
}

function summarizeData(value: unknown): string {
  if (value === undefined || value === null) {
    return "none";
  }
  const raw = typeof value === "string" ? value : stableStringify(value);
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "none";
  }
  return normalized.slice(0, 160);
}

export async function buildCompactionSummary(
  options: { cwd?: string; now?: string; applyPolicy?: boolean } = {}
): Promise<string> {
  if (options.applyPolicy !== false) {
    const entries = await readAllMemoryEntries(options);
    if (entries.length > 0) {
      const policyResult = applyMemoryPolicy({
        now: options.now ?? new Date().toISOString(),
        entries
      });
      await rewriteMemoryEntries(policyResult, options);
    }
  }

  const latest = await readLatestMemoryByScope(options);
  const hasAny = MEMORY_SCOPES.some((scope) => latest[scope]);
  if (!hasAny) {
    return FALLBACK_SUMMARY;
  }

  const tiers = MEMORY_SCOPES.map((scope) => {
    const entry = latest[scope];
    return `${scope}: ${entry ? summarizeData(entry.data) : "none"}`;
  });

  return `Arbiter continuity | ${tiers.join(" | ")}`;
}
