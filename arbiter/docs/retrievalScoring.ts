export type IndexedBrick = {
  path: string;
  heading: string;
  content: string;
  pathTerms?: string[];
  headingTerms?: string[];
  contentTerms?: string[];
};

type ScoredBrick = {
  brick: IndexedBrick;
  baseScore: number;
  noveltyTerms: string[];
};

const PATH_WEIGHT = 1.5;
const HEADING_WEIGHT = 3;
const CONTENT_WEIGHT = 1;
const COVERAGE_BOOST = 4;
const PATH_DIVERSITY_PENALTY = 2.5;
const NOVELTY_PENALTY = 1.5;

const buildCounts = (terms: string[]) => {
  const counts = new Map<string, number>();
  for (const term of terms) {
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
};

const unique = (terms: string[]) => Array.from(new Set(terms));

export const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const getScopeTerms = (brick: IndexedBrick) => ({
  pathTerms: brick.pathTerms ?? tokenize(brick.path),
  headingTerms: brick.headingTerms ?? tokenize(brick.heading),
  contentTerms: brick.contentTerms ?? tokenize(brick.content)
});

const scoreBrick = (brick: IndexedBrick, queryTerms: string[]): ScoredBrick | null => {
  const { pathTerms, headingTerms, contentTerms } = getScopeTerms(brick);
  const pathCounts = buildCounts(pathTerms);
  const headingCounts = buildCounts(headingTerms);
  const contentCounts = buildCounts(contentTerms);

  let relevance = 0;
  let matchedTerms = 0;

  for (const term of queryTerms) {
    const pathHits = pathCounts.get(term) ?? 0;
    const headingHits = headingCounts.get(term) ?? 0;
    const contentHits = contentCounts.get(term) ?? 0;
    const termScore =
      pathHits * PATH_WEIGHT +
      headingHits * HEADING_WEIGHT +
      Math.min(contentHits, 4) * CONTENT_WEIGHT;

    if (termScore > 0) {
      matchedTerms += 1;
      relevance += termScore;
    }
  }

  if (matchedTerms === 0) {
    return null;
  }

  const coverage = matchedTerms / queryTerms.length;
  const baseScore = relevance + coverage * COVERAGE_BOOST;

  return {
    brick,
    baseScore,
    noveltyTerms: unique([...headingTerms, ...contentTerms])
  };
};

const compareScored = (left: ScoredBrick, right: ScoredBrick) => {
  if (right.baseScore !== left.baseScore) return right.baseScore - left.baseScore;
  if (left.brick.path !== right.brick.path) return left.brick.path.localeCompare(right.brick.path);
  return left.brick.heading.localeCompare(right.brick.heading);
};

export const rankBricks = (bricks: IndexedBrick[], query: string, limit: number) => {
  const queryTerms = unique(tokenize(query));
  if (!queryTerms.length || limit <= 0) {
    return [];
  }

  const candidates = bricks
    .map((brick) => scoreBrick(brick, queryTerms))
    .filter((entry): entry is ScoredBrick => entry !== null)
    .sort(compareScored);

  const selected: ScoredBrick[] = [];
  const seenTerms = new Set<string>();

  while (selected.length < limit && candidates.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const samePathCount = selected.filter((entry) => entry.brick.path === candidate.brick.path).length;

      let overlapCount = 0;
      for (const term of candidate.noveltyTerms) {
        if (seenTerms.has(term)) overlapCount += 1;
      }

      const noveltyRatio = candidate.noveltyTerms.length
        ? overlapCount / candidate.noveltyTerms.length
        : 0;
      const adjustedScore =
        candidate.baseScore - samePathCount * PATH_DIVERSITY_PENALTY - noveltyRatio * NOVELTY_PENALTY;

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestIndex = index;
      }
    }

    const [winner] = candidates.splice(bestIndex, 1);
    selected.push(winner);
    for (const term of winner.noveltyTerms) {
      seenTerms.add(term);
    }
  }

  return selected.map((entry) => entry.brick);
};
