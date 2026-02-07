#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
READINESS_PATH="$REPO_ROOT/docs/arbiter/READINESS.md"

test -f "$READINESS_PATH"

grep -Fq "## Core Build Plan Parity" "$READINESS_PATH"
grep -Fq "Role separation" "$READINESS_PATH"
grep -Fq "No done without verifier evidence" "$READINESS_PATH"
grep -Fq '`run-epic` canonical entrypoint' "$READINESS_PATH"
grep -Fq '`execute-plan` compatibility path' "$READINESS_PATH"
grep -Fq "Trust gating remains enforced" "$READINESS_PATH"

echo "Core build plan parity gate passed"
