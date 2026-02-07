#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
README_PATH="$REPO_ROOT/README.md"
READINESS_PATH="$REPO_ROOT/docs/arbiter/READINESS.md"
INSTALL_PATH="$REPO_ROOT/.opencode/INSTALL.md"
USAGE_PATH="$REPO_ROOT/docs/arbiter/USAGE.md"

grep -Fq ".opencode/INSTALL.md#installation-steps" "$README_PATH"
grep -Fq "docs/arbiter/USAGE.md#run-epic-usage" "$README_PATH"
grep -Fq "docs/arbiter/USAGE.md#trust-commands" "$README_PATH"
grep -Fq "docs/arbiter/USAGE.md#context-packs" "$README_PATH"

# Validate linked section anchors exist in linked files
grep -Fq "## Installation Steps" "$INSTALL_PATH"
grep -Fq "## Run-Epic Usage" "$USAGE_PATH"
grep -Fq "## Trust Commands" "$USAGE_PATH"
grep -Fq "## Context Packs" "$USAGE_PATH"

test -f "$READINESS_PATH"
grep -Fq "# Arbiter OS Readiness Scorecard" "$READINESS_PATH"
grep -Fq "## Category Scores" "$READINESS_PATH"
grep -Fq "## Verification Evidence" "$READINESS_PATH"
grep -Fq "## Release Gate" "$READINESS_PATH"

grep -Fq 'npm test' "$READINESS_PATH"
grep -Fq 'tests/opencode/run-tests.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-workspace-init.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-doc-links.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-install-repo-target.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-install-windows-target.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-execute-plan-routing.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-plugin-canonical.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-command-surface.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-no-legacy-runtime-refs.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-ledger-replay.sh' "$READINESS_PATH"
grep -Fq 'tests/arbiter/test-readiness-scores.sh' "$READINESS_PATH"

echo "Documentation readiness/link gate passed"
