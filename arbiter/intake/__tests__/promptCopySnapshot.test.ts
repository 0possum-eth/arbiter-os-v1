import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AMBIGUOUS_START_PROMPT,
  EXPLICIT_ROUTE_BYPASS_TEMPLATE,
  ONE_SENTENCE_PROMPT
} from "../promptCopy";

test("ambiguous start prompt matches frozen copy", () => {
  assert.equal(
    AMBIGUOUS_START_PROMPT,
    [
      "run-epic needs direction before execution.",
      "",
      "Choose a route:",
      "1) Quick Scout from one sentence (Recommended)",
      "2) Brainstorm then Scout",
      "3) Use existing docs",
      "4) Use existing plan",
      "",
      "Reply with 1-4, or paste your one-sentence goal now."
    ].join("\n")
  );
});

test("one-sentence prompt matches frozen copy", () => {
  assert.equal(
    ONE_SENTENCE_PROMPT,
    [
      "I detected a one-sentence goal and can route immediately.",
      "",
      "Recommended route:",
      "1) Quick Scout from one sentence (Recommended)",
      "2) Brainstorm then Scout",
      "3) Use existing docs",
      "4) Use existing plan",
      "",
      "Reply with 1-4 to continue."
    ].join("\n")
  );
});

test("explicit route bypass template remains frozen", () => {
  assert.equal(EXPLICIT_ROUTE_BYPASS_TEMPLATE, "Routing directly to <selected-route> because you explicitly requested it.");
});
