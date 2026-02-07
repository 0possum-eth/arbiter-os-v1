#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

test -f "$REPO_ROOT/scripts/arbiter/install-opencode.ps1"
grep -Fq "scripts/arbiter/install-opencode.ps1" "$REPO_ROOT/.opencode/INSTALL.md"
grep -Fq "install-opencode.ps1" "$REPO_ROOT/docs/README.opencode.md"

echo "Windows install target test passed"
