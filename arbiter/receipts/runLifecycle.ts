type RunLifecycleState = {
  runId: string;
  startedAt: string;
  completedAt?: string;
};

let cachedRunId: string | null = null;
let startedAt: string | null = null;
let completedAt: string | null = null;

const resolveRunId = () => {
  if (!cachedRunId) {
    const envRunId = process.env.ARBITER_RUN_ID;
    cachedRunId = envRunId && envRunId.trim() ? envRunId.trim() : `run-${process.pid}`;
  }
  return cachedRunId;
};

export const getLifecycleRunId = () => resolveRunId();

export const markRunStarted = (): RunLifecycleState => {
  if (!startedAt) startedAt = new Date().toISOString();
  return {
    runId: resolveRunId(),
    startedAt,
    completedAt: completedAt ?? undefined
  };
};

export const markRunCompleted = (): RunLifecycleState => {
  const current = markRunStarted();
  if (!completedAt) {
    completedAt = new Date().toISOString();
  }
  const snapshot = {
    runId: current.runId,
    startedAt: current.startedAt,
    completedAt
  };

  cachedRunId = null;
  startedAt = null;
  completedAt = null;

  return snapshot;
};
