let cachedFallbackRunId: string | null = null;

export const getRunId = () => {
  const envRunId = process.env.ARBITER_RUN_ID;
  if (envRunId && envRunId.trim()) return envRunId.trim();
  if (!cachedFallbackRunId) cachedFallbackRunId = "unknown";
  return cachedFallbackRunId;
};
