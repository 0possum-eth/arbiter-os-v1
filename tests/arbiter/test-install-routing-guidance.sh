#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

INSTALL_DOC="$REPO_ROOT/.opencode/INSTALL.md"
OPENCODE_README="$REPO_ROOT/docs/README.opencode.md"
ROOT_README="$REPO_ROOT/README.md"

test -f "$INSTALL_DOC"
test -f "$OPENCODE_README"
test -f "$ROOT_README"

grep -Fq "hybrid_guided" "$INSTALL_DOC"
grep -Fq "superpowers_core" "$INSTALL_DOC"
grep -Fq "arbiter_core" "$INSTALL_DOC"
grep -Fq "assisted auto-install" "$INSTALL_DOC"

grep -Fq "workflow-mode" "$OPENCODE_README"
grep -Fq "hybrid_guided" "$OPENCODE_README"
grep -Fq "assisted auto-install" "$OPENCODE_README"

grep -Fq "commands/workflow-mode.md" "$ROOT_README"
grep -Fq "hybrid_guided" "$ROOT_README"

echo "Install routing guidance test passed"
