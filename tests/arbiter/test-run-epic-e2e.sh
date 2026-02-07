#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

cd "$TEMP_DIR"
node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" "$REPO_ROOT/scripts/arbiter/arbiter-init-workspace.ts"

cat > "docs/arbiter/reference/_inbox/task-e2e.md" <<'EOF'
# Task E2E Context

This reference is used to populate a deterministic context pack for run-epic e2e.
EOF

cat > "docs/arbiter/_ledger/bricks.jsonl" <<'EOF'
{"path":"docs/arbiter/reference/_inbox/task-e2e.md","heading":"Task E2E Context","content":"Task E2E Context ensures deterministic retrieval for end-to-end receipt gating."}
EOF

cat > "docs/arbiter/prd.json" <<'EOF'
{
  "activeEpicId": "epic-e2e",
  "epics": [
    {
      "id": "epic-e2e",
      "tasks": [
        {
          "id": "task-e2e",
          "query": "Task E2E Context",
          "done": false
        }
      ]
    }
  ]
}
EOF

ARBITER_RUN_ID="run-e2e" \
RUN_EPIC_MODULE="$REPO_ROOT/arbiter/commands/runEpic.ts" \
node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" -e "import { pathToFileURL } from 'node:url'; (async () => { const mod = await import(pathToFileURL(process.env.RUN_EPIC_MODULE).href); const first = await mod.runEpic(); if (first.type !== 'IN_PROGRESS' && first.type !== 'FINALIZED') { throw new Error('Unexpected first run-epic result'); } const second = first.type === 'FINALIZED' ? first : await mod.runEpic(); if (second.type !== 'FINALIZED') { throw new Error('Expected FINALIZED result by second run'); } })();"

RECEIPTS_PATH="docs/arbiter/_ledger/runs/run-e2e/receipts.jsonl"
test -f "$RECEIPTS_PATH"
grep -Fq '"type":"EXECUTOR_COMPLETED"' "$RECEIPTS_PATH"
grep -Fq '"type":"VERIFIER_SPEC"' "$RECEIPTS_PATH"
grep -Fq '"type":"VERIFIER_QUALITY"' "$RECEIPTS_PATH"
grep -Fq '"type":"TASK_COMPLETED"' "$RECEIPTS_PATH"
grep -Fq '"type":"RUN_FINALIZED"' "$RECEIPTS_PATH"

LEDGER_PATH="docs/arbiter/_ledger/prd.events.jsonl"
test -f "$LEDGER_PATH"
grep -Fq '"op":"task_done"' "$LEDGER_PATH"

test -s "docs/arbiter/progress.txt"

echo "Run-epic e2e receipt gate passed"
