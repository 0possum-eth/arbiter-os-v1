import fs from "node:fs";
import path from "node:path";

import { assertValidPhaseName, type SourceRecord } from "./sourceIngest";

type SynthesizePrdInput = {
  baseDir?: string;
  phase?: string;
  label: string;
  epicId: string;
  epicTitle: string;
  problemStatement: string;
  constraints: string[];
  unknowns: string[];
  tasks: string[];
  sourceRecords: SourceRecord[];
};

type SynthesizePrdResult = {
  prdMarkdownPath: string;
  prdMetadataPath: string;
  metadataFileName: string;
};

const LABEL_PATTERN = /[^a-z0-9_-]/g;
const DETERMINISTIC_TS = "1970-01-01T00:00:00.000Z";

const resolveGeneratedAt = () =>
  process.env.ARBITER_DETERMINISTIC === "true" ? DETERMINISTIC_TS : new Date().toISOString();

const normalizeLabel = (label: string): string => {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, "-").replace(LABEL_PATTERN, "");
  return normalized.length > 0 ? normalized : "scout";
};

const normalizeList = (values: string[]): string[] =>
  values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const renderBullets = (values: string[]): string[] =>
  values.length > 0 ? values.map((value) => `- ${value}`) : ["- None"];

export async function synthesizePrd(input: SynthesizePrdInput): Promise<SynthesizePrdResult> {
  const phase = assertValidPhaseName(input.phase ?? "phase-01");
  const label = normalizeLabel(input.label);
  const rootDir = input.baseDir ?? process.cwd();

  const constraints = normalizeList(input.constraints);
  const unknowns = normalizeList(input.unknowns);
  const tasks = normalizeList(input.tasks);
  const sortedSources = [...input.sourceRecords]
    .map((record) => ({ source: record.source, hash: record.hash, phase: record.phase }))
    .sort((a, b) => a.source.localeCompare(b.source) || a.hash.localeCompare(b.hash));

  const phaseDir = path.join(rootDir, "docs", "arbiter", "reference", phase);
  const markdownFileName = `PRD_${label}.md`;
  const metadataFileName = `PRD_${label}_metadata.json`;
  const prdMarkdownPath = `docs/arbiter/reference/${phase}/${markdownFileName}`;
  const prdMetadataPath = `docs/arbiter/reference/${phase}/${metadataFileName}`;

  const metadata = {
    summary: {
      problemStatement: input.problemStatement,
      constraints,
      unknowns
    },
    epic: {
      id: input.epicId,
      title: input.epicTitle,
      intent: input.problemStatement,
      tasks
    },
    synthesis: {
      label,
      generatedAt: resolveGeneratedAt(),
      sources: sortedSources
    }
  };

  const markdown = [
    `# PRD: ${input.epicTitle}`,
    "",
    "## Problem",
    input.problemStatement,
    "",
    "## Constraints",
    ...renderBullets(constraints),
    "",
    "## Unknowns",
    ...renderBullets(unknowns),
    "",
    "## Tasks",
    ...renderBullets(tasks),
    "",
    "## Sources",
    ...renderBullets(sortedSources.map((source) => `${source.source} (${source.hash})`)),
    ""
  ].join("\n");

  await fs.promises.mkdir(phaseDir, { recursive: true });
  await fs.promises.writeFile(path.join(phaseDir, markdownFileName), markdown, "utf8");
  await fs.promises.writeFile(
    path.join(phaseDir, metadataFileName),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8"
  );

  return {
    prdMarkdownPath,
    prdMetadataPath,
    metadataFileName
  };
}

export type { SynthesizePrdInput, SynthesizePrdResult };
