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
  if (trimmed.length === 0) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return `web:${trimmed}`;
  }
  return trimmed;
};

const normalizeContent = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export async function ingestResearch(input: IngestResearchInput): Promise<SourceRecord[]> {
  const phase = assertValidPhaseName(input.phase ?? "phase-01");
  const records: SourceRecord[] = [];

  for (const source of input.sources) {
    const sourceName = normalizeSource(source.source);
    const sourceContent = normalizeContent(source.content);
    if (!sourceName || !sourceContent) {
      continue;
    }

    const record = await ingestSource({
      source: sourceName,
      content: sourceContent,
      phase,
      baseDir: input.baseDir
    });
    records.push(record);
  }

  return records;
}

export type { IngestResearchInput, ResearchSourceInput };
