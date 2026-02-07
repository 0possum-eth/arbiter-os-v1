#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RUN_EPIC_COMMAND_DOC="$REPO_ROOT/commands/run-epic.md"
ARBITER_STATUS_COMMAND_DOC="$REPO_ROOT/commands/arbiter-status.md"
WORKFLOW_MODE_COMMAND_DOC="$REPO_ROOT/commands/workflow-mode.md"
README_PATH="$REPO_ROOT/README.md"
USAGE_DOC="$REPO_ROOT/docs/arbiter/USAGE.md"

test -f "$RUN_EPIC_COMMAND_DOC"
test -f "$ARBITER_STATUS_COMMAND_DOC"
test -f "$WORKFLOW_MODE_COMMAND_DOC"
grep -Fq "canonical entrypoint" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "arbiter-status" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "approve-brick" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "mount-doc" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "list-bricks" "$RUN_EPIC_COMMAND_DOC"

grep -Fq "inspectState" "$ARBITER_STATUS_COMMAND_DOC"
grep -Fq "state snapshot" "$ARBITER_STATUS_COMMAND_DOC"
grep -Fq "evidenceHealth" "$ARBITER_STATUS_COMMAND_DOC"
grep -Fq "canClaimFlawless" "$ARBITER_STATUS_COMMAND_DOC"

grep -Fq "workflow profile" "$WORKFLOW_MODE_COMMAND_DOC"
grep -Fq "hybrid_guided" "$WORKFLOW_MODE_COMMAND_DOC"
grep -Fq "superpowers_core" "$WORKFLOW_MODE_COMMAND_DOC"
grep -Fq "arbiter_core" "$WORKFLOW_MODE_COMMAND_DOC"

grep -Fq "commands/run-epic.md" "$README_PATH"
grep -Fq "run-epic" "$README_PATH"
grep -Fq "trust commands" "$README_PATH"

grep -Fq "commands/run-epic.md" "$USAGE_DOC"
grep -Fq "commands/arbiter-status.md" "$USAGE_DOC"
grep -Fq "commands/workflow-mode.md" "$USAGE_DOC"
grep -Fq "arbiter-status" "$USAGE_DOC"
grep -Fq "workflow-mode" "$USAGE_DOC"
grep -Fq "Run-Epic + Arbiter-Status + Trust Flow" "$USAGE_DOC"
grep -Fq "approve-brick" "$USAGE_DOC"
grep -Fq "mount-doc" "$USAGE_DOC"
grep -Fq "list-bricks" "$USAGE_DOC"

echo "Command surface docs test passed"
