#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ARBITER_AGENT="$REPO_ROOT/.opencode/agents/arbiter.md"
EXECUTOR_AGENT="$REPO_ROOT/.opencode/agents/executor.md"
SPEC_AGENT="$REPO_ROOT/.opencode/agents/verifier-spec.md"
QUALITY_AGENT="$REPO_ROOT/.opencode/agents/verifier-quality.md"
ELECTRICIAN_AGENT="$REPO_ROOT/.opencode/agents/electrician.md"
UX_AGENT="$REPO_ROOT/.opencode/agents/ux-coordinator.md"
LEDGER_AGENT="$REPO_ROOT/.opencode/agents/ledger-keeper.md"
PROMPT_DOC="$REPO_ROOT/docs/arbiter/agent-prompt.md"

test -f "$ARBITER_AGENT"
test -f "$EXECUTOR_AGENT"
test -f "$SPEC_AGENT"
test -f "$QUALITY_AGENT"
test -f "$ELECTRICIAN_AGENT"
test -f "$UX_AGENT"
test -f "$LEDGER_AGENT"
test -f "$PROMPT_DOC"

grep -Fq "EXECUTOR_COMPLETED" "$ARBITER_AGENT"
grep -Fq "VERIFIER_SPEC" "$ARBITER_AGENT"
grep -Fq "VERIFIER_QUALITY" "$ARBITER_AGENT"
grep -Fq "INTEGRATION_CHECKED" "$ARBITER_AGENT"
grep -Fq "UX_SIMULATED" "$ARBITER_AGENT"
grep -Fq "ORACLE_REVIEWED" "$ARBITER_AGENT"

grep -Fq "EXECUTOR_COMPLETED" "$EXECUTOR_AGENT"
grep -Fq "execution" "$EXECUTOR_AGENT"

grep -Fq "VERIFIER_SPEC" "$SPEC_AGENT"
grep -Fq "passed" "$SPEC_AGENT"

grep -Fq "VERIFIER_QUALITY" "$QUALITY_AGENT"
grep -Fq "passed" "$QUALITY_AGENT"

grep -Fq "INTEGRATION_CHECKED" "$ELECTRICIAN_AGENT"

grep -Fq "UX_SIMULATED" "$UX_AGENT"
grep -Fq "journey_checks" "$UX_AGENT"

grep -Fq "task_done" "$LEDGER_AGENT"
grep -Fq "ORACLE_REVIEWED" "$PROMPT_DOC"
grep -Fq "EXECUTOR_COMPLETED" "$PROMPT_DOC"

if grep -Eq "\bTCP\b|\bVP\b|LedgerCommit" "$ARBITER_AGENT" "$EXECUTOR_AGENT" "$SPEC_AGENT" "$QUALITY_AGENT" "$ELECTRICIAN_AGENT" "$UX_AGENT" "$LEDGER_AGENT"; then
  echo "Found legacy packet terminology in agent contracts"
  exit 1
fi

echo "Agent contract sync test passed"
