import fs from "node:fs";
import path from "node:path";

import { getRunId } from "../receipts/runContext";
import { describeScoutCandidateChoice, pickBestScoutCandidate } from "./candidateScoring";
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
const DETERMINISTIC_TS = "1970-01-01T00:00:00.000Z";

const resolveGeneratedAt = () =>
  process.env.ARBITER_DETERMINISTIC === "true" ? DETERMINISTIC_TS : new Date().toISOString();

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

const buildCandidate = (options: {
  epic: PrdEpic | undefined;
  index: number;
  fallbackId: string;
  fallbackTitle: string;
  fallbackProblemStatement: string;
  rootTasks: string[];
}): ScoutCandidate => {
  const { epic, index, fallbackId, fallbackTitle, fallbackProblemStatement, rootTasks } = options;
  const epicId = normalizeString(epic?.id) ?? (index === 0 ? fallbackId : `EPIC-${index + 1}`);
  const epicTitle = normalizeString(epic?.title) ?? (index === 0 ? fallbackTitle : `Candidate ${index + 1}`);
  const epicTasks = toTaskStrings(epic?.tasks);
  const fallbackArtifacts = toStringArray(epic?.scope?.included);
  const taskStrings = epicTasks.length > 0 ? epicTasks : index === 0 ? rootTasks : [];
  const artifactsToTouch =
    taskStrings.length > 0
      ? taskStrings
      : fallbackArtifacts.length > 0
        ? fallbackArtifacts
        : ["docs/arbiter/reference"];

  return {
    id: epicId,
    title: epicTitle,
    intent: normalizeString(epic?.intent) ?? fallbackProblemStatement,
    scope: {
      included: artifactsToTouch,
      excluded: toStringArray(epic?.scope?.excluded)
    },
    prerequisites: [],
    estimatedComplexity: "low",
    artifactsToTouch,
    risks: [],
    disallowedActions: []
  };
};

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

  const rootTasks = toTaskStrings(metadata.tasks);
  const primaryTasks = toTaskStrings(epic?.tasks);
  const taskStrings = primaryTasks.length > 0 ? primaryTasks : rootTasks;

  const constraintsWithTasks =
    taskStrings.length > 0
      ? constraints.concat(taskStrings.map((task) => `task:${task}`))
      : constraints;

  const epicPool =
    Array.isArray(metadata.epics) && metadata.epics.length > 0
      ? metadata.epics
      : epic
        ? [epic]
        : [];

  const candidates = (epicPool.length > 0 ? epicPool : [epic]).map((item, index) =>
    buildCandidate({
      epic: item,
      index,
      fallbackId: epicId,
      fallbackTitle: epicTitle,
      fallbackProblemStatement: problemStatement,
      rootTasks
    })
  );

  const recommendedCandidate = pickBestScoutCandidate(candidates, epicId) ?? candidates[0];
  const recommendationRationale = describeScoutCandidateChoice(candidates, recommendedCandidate, epicId);

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
      generatedAt: resolveGeneratedAt(),
      confidence: "medium"
    },
    summary: {
      problemStatement,
      constraints: constraintsWithTasks,
      unknowns
    },
    candidates,
    recommendation: {
      candidateId: recommendedCandidate.id,
      rationale: recommendationRationale
    }
  };
}
