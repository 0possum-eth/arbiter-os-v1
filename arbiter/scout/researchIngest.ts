import { assertValidPhaseName, ingestSource, type SourceRecord } from "./sourceIngest";

type ResearchSourceInput = {
  source: string;
  content: string;
};

type IngestResearchInput = {
  sources: ResearchSourceInput[];
  phase?: string;
  baseDir?: string;
};

const normalizeSource = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function ingestResearch(input: IngestResearchInput): Promise<SourceRecord[]> {
  const phase = assertValidPhaseName(input.phase ?? "phase-01");
  const records: SourceRecord[] = [];

  for (const source of input.sources) {
    const sourceName = normalizeSource(source.source);
    if (!sourceName) {
      continue;
    }

    const record = await ingestSource({
      source: sourceName,
      content: source.content,
      phase,
      baseDir: input.baseDir
    });
    records.push(record);
  }

  return records;
}

export type { IngestResearchInput, ResearchSourceInput };
