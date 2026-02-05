#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Test: Agent Prompts ==="

required_agents=(
  "arbiter.md"
  "scout.md"
  "executor.md"
  "verifier-spec.md"
  "verifier-quality.md"
  "ledger-keeper.md"
)

for agent in "${required_agents[@]}"; do
  if [ -f "$REPO_ROOT/.opencode/agents/$agent" ]; then
    echo "  [PASS] Found $agent"
  else
    echo "  [FAIL] Missing $agent"
    exit 1
  fi
done

echo "=== Agent prompt checks passed ==="
