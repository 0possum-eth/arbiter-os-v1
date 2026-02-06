import fs from "node:fs";
import path from "node:path";

import { getRunId } from "../receipts/runContext";
import { assertValidPhaseName, ingestSource, type SourceRecord } from "./sourceIngest";

type PrdEpic = {
  id?: string;
  title?: string;
  intent?: string;
  tasks?: unknown;
  scope?: {
    included?: unknown;
    excluded?: unknown;
  };
};

type PrdSummary = {
  problemStatement?: string;
  constraints?: unknown;
  unknowns?: unknown;
};

type PrdMetadata = {
  epic?: PrdEpic;
  epics?: PrdEpic[];
  tasks?: unknown;
  summary?: PrdSummary;
  problemStatement?: string;
  constraints?: unknown;
  unknowns?: unknown;
};

type ScoutSourceRef = Pick<SourceRecord, "source" | "hash" | "phase">;

type ScoutCandidate = {
  id: string;
  title: string;
  intent: string;
  scope: {
    included: string[];
    excluded: string[];
  };
  prerequisites: string[];
  estimatedComplexity: "low" | "medium" | "high";
  artifactsToTouch: string[];
  risks: string[];
  disallowedActions: string[];
};

export type ScoutEnvelope = {
  schemaVersion: "arbiter.scout.v1";
  metadata: {
    runId: string;
    scoutId: string;
    generatedAt: string;
    confidence: "low" | "medium" | "high";
  };
  summary: {
    problemStatement: string;
    constraints: string[];
    unknowns: string[];
  };
  candidates: ScoutCandidate[];
  recommendation: {
    candidateId: string;
    rationale: string;
  };
};

export type ExtractPrdOptions = {
  baseDir?: string;
  phase?: string;
  metadataFileName?: string;
};

const PRD_FILE_PATTERN = /^[A-Za-z0-9._-]+$/;

const assertValidPrdFileName = (fileName: string): string => {
  if (PRD_FILE_PATTERN.test(fileName)) {
    return fileName;
  }

  throw new Error(`Invalid PRD metadata file name: ${fileName}`);
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeString).filter((item): item is string => !!item);
};

const toTaskStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((task) => {
      if (typeof task === "string") return normalizeString(task);
      if (task && typeof task === "object") {
        const record = task as Record<string, unknown>;
        return (
          normalizeString(record.title) ||
          normalizeString(record.task) ||
          normalizeString(record.name)
        );
      }
      return null;
    })
    .filter((item): item is string => !!item);
};

const pickEpic = (metadata: PrdMetadata): PrdEpic | undefined =>
  metadata.epic ?? metadata.epics?.[0];

export async function extractPrd(options: ExtractPrdOptions = {}): Promise<ScoutEnvelope | null> {
  const rootDir = options.baseDir ?? process.cwd();
  const phase = assertValidPhaseName(options.phase ?? "phase-01");
  const metadataFileName = assertValidPrdFileName(options.metadataFileName ?? "PRD_metadata.json");
  const prdSource = `docs/arbiter/reference/${phase}/${metadataFileName}`;
  const prdPath = path.join(
    rootDir,
    "docs",
    "arbiter",
    "reference",
    phase,
    metadataFileName
  );

  let raw: string;
  try {
    raw = await fs.promises.readFile(prdPath, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }

  let metadata: PrdMetadata;
  try {
    metadata = JSON.parse(raw) as PrdMetadata;
  } catch {
    return null;
  }

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const epic = pickEpic(metadata);
  const epicId = normalizeString(epic?.id) ?? "EPIC-1";
  const epicTitle = normalizeString(epic?.title) ?? "Untitled epic";

  const summary = metadata.summary ?? {};
  const problemStatement =
    normalizeString(summary.problemStatement) ||
    normalizeString(metadata.problemStatement) ||
    normalizeString(epic?.intent) ||
    "Define the next epic.";

  const constraints = toStringArray(summary.constraints ?? metadata.constraints);
  const unknowns = toStringArray(summary.unknowns ?? metadata.unknowns);

  const epicTasks = toTaskStrings(epic?.tasks);
  const rootTasks = toTaskStrings(metadata.tasks);
  const taskStrings = epicTasks.length > 0 ? epicTasks : rootTasks;

  const fallbackArtifacts = toStringArray(epic?.scope?.included);
  const artifactsToTouch =
    taskStrings.length > 0
      ? taskStrings
      : fallbackArtifacts.length > 0
        ? fallbackArtifacts
        : ["docs/arbiter/reference"];

  const scopeIncluded =
    taskStrings.length > 0
      ? taskStrings
      : fallbackArtifacts.length > 0
        ? fallbackArtifacts
        : ["docs/arbiter/reference"];

  const constraintsWithTasks =
    taskStrings.length > 0
      ? constraints.concat(taskStrings.map((task) => `task:${task}`))
      : constraints;

  const sourceRef = await ingestSource({
    source: prdSource,
    phase,
    content: raw,
    baseDir: rootDir
  });

  return {
    schemaVersion: "arbiter.scout.v1",
    metadata: {
      runId: getRunId(),
      scoutId: `scout-${sourceRef.hash.slice(0, 12)}`,
      generatedAt: "1970-01-01T00:00:00.000Z",
      confidence: "medium"
    },
    summary: {
      problemStatement,
      constraints: constraintsWithTasks,
      unknowns
    },
    candidates: [
      {
        id: epicId,
        title: epicTitle,
        intent: normalizeString(epic?.intent) ?? problemStatement,
        scope: {
          included: scopeIncluded,
          excluded: toStringArray(epic?.scope?.excluded)
        },
        prerequisites: [],
        estimatedComplexity: "low",
        artifactsToTouch,
        risks: [],
        disallowedActions: []
      }
    ],
    recommendation: {
      candidateId: epicId,
      rationale: "Derived from PRD metadata"
    }
  };
}
