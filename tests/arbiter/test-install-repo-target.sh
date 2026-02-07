#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET_REPO="https://github.com/0possum-eth/arbiter-os-v1.git"

grep -Fq "$TARGET_REPO" "$REPO_ROOT/.opencode/INSTALL.md"
grep -Fq "$TARGET_REPO" "$REPO_ROOT/README.md"
grep -Fq "$TARGET_REPO" "$REPO_ROOT/docs/README.opencode.md"
grep -Fq "$TARGET_REPO" "$REPO_ROOT/scripts/arbiter/install-opencode.sh"
grep -Fq "$TARGET_REPO" "$REPO_ROOT/scripts/arbiter/install-opencode.ps1"

echo "Install repo target test passed"
