import assert from "node:assert/strict";
import { test } from "node:test";

import { applyMemoryPolicy } from "../policy";

test("applyMemoryPolicy promotes high-salience entries and decays stale entries", () => {
  const result = applyMemoryPolicy({
    now: "2026-02-10T00:00:00.000Z",
    entries: [
      {
        scope: "session",
        ts: "2026-02-09T00:00:00.000Z",
        data: { note: "hot signal", salience: 0.95 }
      },
      {
        scope: "project",
        ts: "2025-12-01T00:00:00.000Z",
        data: { note: "old signal", salience: 0.1 }
      }
    ]
  });

  const promoted = result.find((entry) => (entry.data as { note?: string }).note === "hot signal");
  const decayed = result.find((entry) => (entry.data as { note?: string }).note === "old signal");

  assert.equal(promoted?.scope, "project");
  assert.equal(decayed?.scope, "session");
});
