#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REQUIREMENTS_PATH="$REPO_ROOT/docs/arbiter/DUAL_STACK_REQUIREMENTS.md"

test -f "$REQUIREMENTS_PATH"
grep -Fq "# Dual-Stack Routing Requirements" "$REQUIREMENTS_PATH"

grep -Fq "## Route Selection Behavior" "$REQUIREMENTS_PATH"
grep -Fq "Prompt only when route is ambiguous" "$REQUIREMENTS_PATH"
grep -Fq "Quick Scout from one sentence" "$REQUIREMENTS_PATH"
grep -Fq "Brainstorm then Scout" "$REQUIREMENTS_PATH"
grep -Fq "Use existing docs" "$REQUIREMENTS_PATH"
grep -Fq "Use existing plan" "$REQUIREMENTS_PATH"

grep -Fq "## Dependency Automation Policy" "$REQUIREMENTS_PATH"
grep -Fq "prerequisites + toolchain" "$REQUIREMENTS_PATH"
grep -Fq "explicit user consent" "$REQUIREMENTS_PATH"

grep -Fq "## Truthfulness Guardrails" "$REQUIREMENTS_PATH"
grep -Fq "must not claim" "$REQUIREMENTS_PATH"

grep -Fq "## Mandatory Closure Checklist" "$REQUIREMENTS_PATH"
grep -Fq "All acceptance criteria verification commands pass" "$REQUIREMENTS_PATH"
grep -Fq "No task is marked done without verifier evidence and ledger continuity" "$REQUIREMENTS_PATH"
grep -Fq "Generated run artifacts are cleaned before publication commits" "$REQUIREMENTS_PATH"

echo "Dual-stack requirements gate passed"
