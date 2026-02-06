#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
README_PATH="$REPO_ROOT/README.md"

grep -Fq ".opencode/INSTALL.md#installation-steps" "$README_PATH"
grep -Fq "docs/arbiter/USAGE.md#run-epic-usage" "$README_PATH"
grep -Fq "docs/arbiter/USAGE.md#trust-commands" "$README_PATH"
grep -Fq "docs/arbiter/USAGE.md#context-packs" "$README_PATH"

echo "README doc links test passed"
