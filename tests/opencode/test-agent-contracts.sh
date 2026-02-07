#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENT_DIR="$REPO_ROOT/.opencode/agents"

echo "=== Test: Agent Packet Contracts ==="

require_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Fq "$pattern" "$file"; then
    echo "  [PASS] $(basename "$file"): $label"
  else
    echo "  [FAIL] $(basename "$file"): missing $label ($pattern)"
    exit 1
  fi
}

agents=(
  "arbiter.md"
  "scout.md"
  "executor.md"
  "verifier-spec.md"
  "verifier-quality.md"
  "ledger-keeper.md"
  "electrician.md"
  "ux-coordinator.md"
  "librarian.md"
  "oracle.md"
)

for agent in "${agents[@]}"; do
  path="$AGENT_DIR/$agent"
  if [ ! -f "$path" ]; then
    echo "  [FAIL] Missing agent prompt: $agent"
    exit 1
  fi

  require_contains "$path" "## Role Purpose" "role purpose section"
  require_contains "$path" "## Hard Constraints" "hard constraints section"
done

require_contains "$AGENT_DIR/arbiter.md" "EXECUTOR_COMPLETED" "executor completion receipt reference"
require_contains "$AGENT_DIR/arbiter.md" "VERIFIER_SPEC" "spec verifier receipt reference"
require_contains "$AGENT_DIR/arbiter.md" "VERIFIER_QUALITY" "quality verifier receipt reference"
require_contains "$AGENT_DIR/arbiter.md" "INTEGRATION_CHECKED" "integration receipt reference"
require_contains "$AGENT_DIR/arbiter.md" "UX_SIMULATED" "ux receipt reference"
require_contains "$AGENT_DIR/arbiter.md" "ORACLE_REVIEWED" "oracle receipt reference"

require_contains "$AGENT_DIR/executor.md" "EXECUTOR_COMPLETED" "executor completion receipt reference"
require_contains "$AGENT_DIR/verifier-spec.md" "VERIFIER_SPEC" "spec verifier receipt reference"
require_contains "$AGENT_DIR/verifier-quality.md" "VERIFIER_QUALITY" "quality verifier receipt reference"
require_contains "$AGENT_DIR/electrician.md" "INTEGRATION_CHECKED" "integration receipt reference"
require_contains "$AGENT_DIR/ux-coordinator.md" "UX_SIMULATED" "ux receipt reference"
require_contains "$AGENT_DIR/ux-coordinator.md" "journey_checks" "ux journey checks reference"
require_contains "$AGENT_DIR/ledger-keeper.md" "task_done" "ledger task completion reference"

echo "=== Agent packet contract checks passed ==="
