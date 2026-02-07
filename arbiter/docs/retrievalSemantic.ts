const SEMANTIC_GROUPS: Record<string, string[]> = {
  release: ["release", "deploy", "deployment", "shipping", "ship", "rollout", "launch"],
  plan: ["plan", "blueprint", "spec", "specification", "roadmap"],
  verify: ["verify", "verification", "validate", "validation", "check"]
};

const STEM_SUFFIXES = ["ing", "ed", "es", "s"];

const stem = (term: string) => {
  for (const suffix of STEM_SUFFIXES) {
    if (term.length > suffix.length + 2 && term.endsWith(suffix)) {
      return term.slice(0, -suffix.length);
    }
  }
  return term;
};

const buildLookup = () => {
  const lookup = new Map<string, string>();
  for (const [canonical, variants] of Object.entries(SEMANTIC_GROUPS)) {
    for (const variant of variants) {
      lookup.set(stem(variant), canonical);
    }
  }
  return lookup;
};

const SEMANTIC_LOOKUP = buildLookup();

export const toSemanticToken = (term: string) => SEMANTIC_LOOKUP.get(stem(term.toLowerCase())) ?? stem(term.toLowerCase());

export const semanticCoverage = (queryTerms: string[], candidateTerms: string[]) => {
  if (queryTerms.length === 0) {
    return 0;
  }
  const candidateSet = new Set(candidateTerms.map((term) => toSemanticToken(term)));
  let hits = 0;
  for (const queryTerm of queryTerms) {
    if (candidateSet.has(toSemanticToken(queryTerm))) {
      hits += 1;
    }
  }
  return hits / queryTerms.length;
};
