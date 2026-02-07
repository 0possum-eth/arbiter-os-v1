#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
READINESS_PATH="$REPO_ROOT/docs/arbiter/READINESS.md"

test -f "$READINESS_PATH"

grep -Eq "\| Orchestration kernel & command surface \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Execution \+ verification \+ done gating \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Ledger/state architecture \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Trust gating & role isolation \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Retrieval/context quality \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Memory/continuity \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Scout/research-to-PRD loop \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Eq "\| Install/docs/runtime migration readiness \| (9[0-9]|100)/100 \|" "$READINESS_PATH"
grep -Fq "## Evidence Metadata" "$READINESS_PATH"
grep -Eq -- "- generatedAt: [0-9]{4}-[0-9]{2}-[0-9]{2}T" "$READINESS_PATH"
grep -Eq -- "- sourceCommit: [a-f0-9]{7,40}" "$READINESS_PATH"

echo "Readiness score floor test passed"
