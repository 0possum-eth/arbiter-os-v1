#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
USAGE_DOC="$REPO_ROOT/docs/arbiter/USAGE.md"

test -f "$REPO_ROOT/arbiter/ledger/rebuildViews.ts"
npm test -- "arbiter/ledger/__tests__/rebuildViews.test.ts"

grep -Fq "## Ledger Replay" "$USAGE_DOC"
grep -Fq "rebuildViewsFromLedger" "$USAGE_DOC"

echo "Ledger replay gate passed"
