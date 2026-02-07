#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$TMP_DIR"
node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" "$REPO_ROOT/scripts/arbiter/arbiter-init-workspace.ts"

RUN_EPIC_MODULE="$REPO_ROOT/arbiter/run/runEpicAutopilot.ts" \
node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" -e "import { pathToFileURL } from 'node:url'; (async () => { const mod = await import(pathToFileURL(process.env.RUN_EPIC_MODULE).href); const result = await mod.runEpicAutopilot({ preflight: { consentGranted: false, doctor: async () => ({ envReady: false, missingPrerequisites: ['git'], missingToolchain: [] }), planner: () => ({ actions: [{ id: 'install-git', target: 'git', command: 'echo git' }] }), executor: async () => { throw new Error('executor should not run'); } } }); if (result.type !== 'HALT_AND_ASK' || result.receipt.type !== 'HALT_AND_ASK' || result.receipt.reason !== 'ENV_NOT_READY') { throw new Error('Expected ENV_NOT_READY HALT_AND_ASK'); } })();"

RECEIPTS_PATH=$(ls docs/arbiter/_ledger/runs/*/receipts.jsonl)
grep -Fq '"type":"HALT_AND_ASK"' "$RECEIPTS_PATH"
grep -Fq '"reason":"ENV_NOT_READY"' "$RECEIPTS_PATH"

if grep -Fq '"type":"TASK_COMPLETED"' "$RECEIPTS_PATH"; then
  echo "Unexpected task completion receipt found"
  exit 1
fi

echo "Run-epic intake routing regression gate passed"
