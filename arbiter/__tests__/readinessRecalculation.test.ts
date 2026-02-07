import assert from "node:assert/strict";
import { test } from "node:test";

import { renderEvidenceMetadataSection } from "../../scripts/arbiter/recalculate-readiness";

test("renderEvidenceMetadataSection emits generatedAt and sourceCommit fields", () => {
  const section = renderEvidenceMetadataSection({
    generatedAt: "2026-02-06T10:00:00.000Z",
    sourceCommit: "0123456789abcdef0123456789abcdef01234567"
  });

  assert.match(section, /## Evidence Metadata/);
  assert.match(section, /- generatedAt: 2026-02-06T10:00:00.000Z/);
  assert.match(section, /- sourceCommit: 0123456789abcdef0123456789abcdef01234567/);
});
