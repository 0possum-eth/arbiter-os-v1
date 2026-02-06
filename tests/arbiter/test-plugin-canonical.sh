#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

INSTALL_DOC="$REPO_ROOT/.opencode/INSTALL.md"
OPENCODE_DOC="$REPO_ROOT/docs/README.opencode.md"

echo "=== Test: Canonical plugin path in docs ==="

echo "Test 1: INSTALL doc uses canonical plugin path..."
if grep -Fq "plugins/arbiter-os.js" "$INSTALL_DOC"; then
    echo "  [PASS] INSTALL doc references plugins/arbiter-os.js"
else
    echo "  [FAIL] INSTALL doc missing plugins/arbiter-os.js reference"
    exit 1
fi

echo "Test 2: OpenCode README uses canonical plugin path..."
if grep -Fq "plugins/arbiter-os.js" "$OPENCODE_DOC"; then
    echo "  [PASS] OpenCode README references plugins/arbiter-os.js"
else
    echo "  [FAIL] OpenCode README missing plugins/arbiter-os.js reference"
    exit 1
fi

echo "Test 3: INSTALL doc does not use legacy plugin path..."
if grep -Fq "plugins/superpowers.js" "$INSTALL_DOC"; then
    echo "  [FAIL] INSTALL doc still references plugins/superpowers.js"
    exit 1
else
    echo "  [PASS] INSTALL doc has no legacy plugin path"
fi

echo "Test 4: OpenCode README does not use legacy plugin path..."
if grep -Fq "plugins/superpowers.js" "$OPENCODE_DOC"; then
    echo "  [FAIL] OpenCode README still references plugins/superpowers.js"
    exit 1
else
    echo "  [PASS] OpenCode README has no legacy plugin path"
fi

echo ""
echo "Canonical plugin doc wiring test passed"
