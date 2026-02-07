export const AMBIGUOUS_START_PROMPT = [
  "run-epic needs direction before execution.",
  "",
  "Choose a route:",
  "1) Quick Scout from one sentence (Recommended)",
  "2) Brainstorm then Scout",
  "3) Use existing docs",
  "4) Use existing plan",
  "",
  "Reply with 1-4, or paste your one-sentence goal now."
].join("\n");

export const ONE_SENTENCE_PROMPT = [
  "I detected a one-sentence goal and can route immediately.",
  "",
  "Recommended route:",
  "1) Quick Scout from one sentence (Recommended)",
  "2) Brainstorm then Scout",
  "3) Use existing docs",
  "4) Use existing plan",
  "",
  "Reply with 1-4 to continue."
].join("\n");

export const EXPLICIT_ROUTE_BYPASS_TEMPLATE =
  "Routing directly to <selected-route> because you explicitly requested it.";
