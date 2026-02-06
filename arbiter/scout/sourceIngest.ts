import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type IngestSourceInput = {
  source: string;
  phase: string;
  content: string;
  baseDir?: string;
};

type SourceRecord = {
  ts: string;
  source: string;
  hash: string;
  phase: string;
};

const PHASE_DIRECTORY_PATTERN = /^phase-[a-zA-Z0-9_-]+$/;

export function assertValidPhaseName(phase: string): string {
  if (PHASE_DIRECTORY_PATTERN.test(phase)) {
    return phase;
  }

  throw new Error(`Invalid phase: ${phase}`);
}

export async function ingestSource(input: IngestSourceInput): Promise<SourceRecord> {
  const phase = assertValidPhaseName(input.phase);
  const record: SourceRecord = {
    ts: new Date().toISOString(),
    source: input.source,
    hash: crypto.createHash("sha256").update(input.content).digest("hex"),
    phase
  };

  const sourcesPath = path.join(
    input.baseDir ?? process.cwd(),
    "docs",
    "arbiter",
    "reference",
    phase,
    "sources.jsonl"
  );
  await fs.promises.mkdir(path.dirname(sourcesPath), { recursive: true });
  await fs.promises.appendFile(sourcesPath, `${JSON.stringify(record)}\n`, "utf8");

  return record;
}

export type { SourceRecord };
