#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

LEGACY_REF="plugins/superpowers.js"

ACTIVE_PATHS=(
    "$REPO_ROOT/.opencode/INSTALL.md"
    "$REPO_ROOT/docs/README.opencode.md"
    "$REPO_ROOT/tests/opencode/test-plugin-loading.sh"
)

echo "=== Test: No legacy runtime references in active paths ==="

for path in "${ACTIVE_PATHS[@]}"; do
    echo "Checking $path..."
    if grep -Fq "$LEGACY_REF" "$path"; then
        echo "  [FAIL] Found legacy runtime reference: $LEGACY_REF"
        exit 1
    else
        echo "  [PASS] No legacy runtime reference found"
    fi
done

echo ""
echo "No legacy runtime references detected in active paths"
