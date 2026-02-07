type ScoutCandidateForScoring = {
  id: string;
  estimatedComplexity?: "low" | "medium" | "high";
  artifactsToTouch?: string[];
  disallowedActions?: string[];
};

type ScoutScoreBreakdown = {
  taskCountWeight: number;
  executionReadinessBonus: number;
  complexityWeight: number;
  disallowedPenalty: number;
  recommendationBias: number;
};

type ScoutScoredCandidate<T extends ScoutCandidateForScoring> = {
  candidate: T;
  totalScore: number;
  breakdown: ScoutScoreBreakdown;
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
  return scoreScoutCandidateWithBreakdown(candidate, recommendedCandidateId).totalScore;
};

export const scoreScoutCandidateWithBreakdown = <T extends ScoutCandidateForScoring>(
  candidate: T,
  recommendedCandidateId?: string
): ScoutScoredCandidate<T> => {
  const taskCount = Array.isArray(candidate.artifactsToTouch) ? candidate.artifactsToTouch.length : 0;
  const disallowedCount = Array.isArray(candidate.disallowedActions) ? candidate.disallowedActions.length : 0;
  const complexity = candidate.estimatedComplexity ?? "medium";
  const taskCountWeight = Math.min(taskCount, 5) * 2;
  const executionReadinessBonus = taskCount > 0 ? 3 : 0;
  const complexityWeight = COMPLEXITY_WEIGHT[complexity] ?? COMPLEXITY_WEIGHT.medium;
  const disallowedPenalty = disallowedCount * 3;
  const recommendationBias = candidate.id === recommendedCandidateId ? 0.25 : 0;

  const totalScore =
    taskCountWeight + executionReadinessBonus + complexityWeight - disallowedPenalty + recommendationBias;

  return {
    candidate,
    totalScore,
    breakdown: {
      taskCountWeight,
      executionReadinessBonus,
      complexityWeight,
      disallowedPenalty,
      recommendationBias
    }
  };
};

const compareScoredCandidates = <T extends ScoutCandidateForScoring>(
  left: ScoutScoredCandidate<T>,
  right: ScoutScoredCandidate<T>
) => {
  if (right.totalScore !== left.totalScore) {
    return right.totalScore - left.totalScore;
  }
  return left.candidate.id.localeCompare(right.candidate.id);
};

const summarizeBreakdown = (breakdown: ScoutScoreBreakdown) =>
  [
    `tasks:${breakdown.taskCountWeight.toFixed(2)}`,
    `readiness:${breakdown.executionReadinessBonus.toFixed(2)}`,
    `complexity:${breakdown.complexityWeight.toFixed(2)}`,
    `penalty:${breakdown.disallowedPenalty.toFixed(2)}`,
    `bias:${breakdown.recommendationBias.toFixed(2)}`
  ].join("+");

export const pickBestScoutCandidate = <T extends ScoutCandidateForScoring>(
  candidates: T[],
  recommendedCandidateId?: string
): T | undefined => {
  if (candidates.length === 0) {
    return undefined;
  }

  return [...candidates]
    .map((candidate) => scoreScoutCandidateWithBreakdown(candidate, recommendedCandidateId))
    .sort(compareScoredCandidates)
    .at(0)?.candidate;
};

export const describeScoutCandidateChoice = <T extends ScoutCandidateForScoring>(
  candidates: T[],
  chosen: T,
  recommendedCandidateId?: string
) => {
  const scored = candidates
    .map((candidate) => scoreScoutCandidateWithBreakdown(candidate, recommendedCandidateId))
    .sort(compareScoredCandidates);
  const winner = scored.find((entry) => entry.candidate.id === chosen.id);
  if (!winner) {
    return `score=0.00 reasons=unscored tie=id`;
  }

  const tiedIds = scored
    .filter((entry) => entry.totalScore === winner.totalScore)
    .map((entry) => entry.candidate.id)
    .sort();
  const tieMode = tiedIds.length > 1 ? `id:${tiedIds.join(">")}` : "none";
  return `score=${winner.totalScore.toFixed(2)} reasons=${summarizeBreakdown(winner.breakdown)} tie=${tieMode}`;
};
