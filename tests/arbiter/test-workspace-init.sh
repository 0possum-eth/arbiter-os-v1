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
test -f "docs/arbiter/prd.json"
test -f "docs/arbiter/_ledger/prd.events.jsonl"
test -f "docs/arbiter/_ledger/receipts/receipts.jsonl"

echo "Workspace init test passed"
