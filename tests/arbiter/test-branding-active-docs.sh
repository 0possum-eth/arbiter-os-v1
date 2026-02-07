#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

README_PATH="$REPO_ROOT/README.md"
OPENCODE_README_PATH="$REPO_ROOT/docs/README.opencode.md"
INSTALL_PATH="$REPO_ROOT/.opencode/INSTALL.md"
TESTING_PATH="$REPO_ROOT/docs/testing.md"

test -f "$README_PATH"
test -f "$OPENCODE_README_PATH"
test -f "$INSTALL_PATH"
test -f "$TESTING_PATH"

grep -Fq "# Arbiter OS" "$README_PATH"
grep -Fq "Superpowers compatibility" "$README_PATH"

grep -Fq "# Arbiter OS for OpenCode" "$OPENCODE_README_PATH"
grep -Fq "Superpowers compatibility" "$OPENCODE_README_PATH"

grep -Fq "# Installing Arbiter OS for OpenCode" "$INSTALL_PATH"
grep -Fq "Superpowers compatibility" "$INSTALL_PATH"

grep -Fq "# Testing Arbiter OS Skills" "$TESTING_PATH"
grep -Fq "Superpowers compatibility" "$TESTING_PATH"

echo "Branding gate passed for active docs"
