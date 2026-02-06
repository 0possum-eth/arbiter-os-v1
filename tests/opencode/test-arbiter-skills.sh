#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Test: Arbiter OS Skills ==="

required_skills=(
  "using-arbiter-os"
  "arbiter-run-loop"
  "arbiter-ledger-rules"
  "arbiter-doc-ingest"
  "arbiter-trust-gating"
  "arbiter-ux-sim"
)

for skill in "${required_skills[@]}"; do
  if [ -f "$REPO_ROOT/.opencode/skills/$skill/SKILL.md" ]; then
    echo "  [PASS] Found $skill"
  else
    echo "  [FAIL] Missing $skill"
    exit 1
  fi
done

echo "=== Arbiter OS skill checks passed ==="
