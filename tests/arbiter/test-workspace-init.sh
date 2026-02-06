#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

cd "$TEMP_DIR"
node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" "$REPO_ROOT/scripts/arbiter/arbiter-init-workspace.ts"

test -d "docs/arbiter/reference/_inbox"
test -d "docs/arbiter/_ledger"
test -d "docs/arbiter/build-log"
test -f "docs/arbiter/prd.json"
test -f "docs/arbiter/progress.txt"
test -f "docs/arbiter/_ledger/prd.events.jsonl"
test -d "docs/arbiter/_ledger/runs"
test -f "docs/arbiter/_ledger/runs.jsonl"

printf '{"custom":true}\n' > "docs/arbiter/prd.json"
node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" "$REPO_ROOT/scripts/arbiter/arbiter-init-workspace.ts"
grep -Fq '"custom":true' "docs/arbiter/prd.json"

echo "Workspace init test passed"
