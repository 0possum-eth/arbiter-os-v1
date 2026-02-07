type ScoutCandidateForScoring = {
  id: string;
  estimatedComplexity?: "low" | "medium" | "high";
  artifactsToTouch?: string[];
  disallowedActions?: string[];
};

const COMPLEXITY_WEIGHT: Record<"low" | "medium" | "high", number> = {
  low: 2,
  medium: 1,
  high: 0
};

export const scoreScoutCandidate = (
  candidate: ScoutCandidateForScoring,
  recommendedCandidateId?: string
): number => {
  const taskCount = Array.isArray(candidate.artifactsToTouch) ? candidate.artifactsToTouch.length : 0;
  const disallowedCount = Array.isArray(candidate.disallowedActions) ? candidate.disallowedActions.length : 0;
  const complexity = candidate.estimatedComplexity ?? "medium";
  const taskCountWeight = Math.min(taskCount, 5) * 2;
  const executionReadinessBonus = taskCount > 0 ? 3 : 0;
  const confidenceWeight = COMPLEXITY_WEIGHT[complexity] ?? COMPLEXITY_WEIGHT.medium;
  const unknownPenalty = disallowedCount * 3;
  const recommendationBias = candidate.id === recommendedCandidateId ? 0.25 : 0;

  return taskCountWeight + executionReadinessBonus + confidenceWeight - unknownPenalty + recommendationBias;
};

export const pickBestScoutCandidate = <T extends ScoutCandidateForScoring>(
  candidates: T[],
  recommendedCandidateId?: string
): T | undefined => {
  if (candidates.length === 0) {
    return undefined;
  }

  return [...candidates]
    .sort((left, right) => {
      const rightScore = scoreScoutCandidate(right, recommendedCandidateId);
      const leftScore = scoreScoutCandidate(left, recommendedCandidateId);
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return left.id.localeCompare(right.id);
    })
    .at(0);
};
