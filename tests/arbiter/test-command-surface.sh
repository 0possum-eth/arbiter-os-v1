#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RUN_EPIC_COMMAND_DOC="$REPO_ROOT/commands/run-epic.md"
README_PATH="$REPO_ROOT/README.md"
USAGE_DOC="$REPO_ROOT/docs/arbiter/USAGE.md"

test -f "$RUN_EPIC_COMMAND_DOC"
grep -Fq "canonical entrypoint" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "approve-brick" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "mount-doc" "$RUN_EPIC_COMMAND_DOC"
grep -Fq "list-bricks" "$RUN_EPIC_COMMAND_DOC"

grep -Fq "commands/run-epic.md" "$README_PATH"
grep -Fq "run-epic" "$README_PATH"
grep -Fq "trust commands" "$README_PATH"

grep -Fq "commands/run-epic.md" "$USAGE_DOC"
grep -Fq "Run-Epic + Trust Flow" "$USAGE_DOC"
grep -Fq "approve-brick" "$USAGE_DOC"
grep -Fq "mount-doc" "$USAGE_DOC"

echo "Command surface docs test passed"
