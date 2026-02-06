#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OPENCODE_DIR="$HOME/.config/opencode"

mkdir -p "$OPENCODE_DIR/plugins"
mkdir -p "$OPENCODE_DIR/superpowers/.opencode/plugins"

cp "$REPO_ROOT/.opencode/plugins/arbiter-os.js" "$OPENCODE_DIR/superpowers/.opencode/plugins/arbiter-os.js"
ln -sf "$OPENCODE_DIR/superpowers/.opencode/plugins/arbiter-os.js" "$OPENCODE_DIR/plugins/arbiter-os.js" || true

echo "Arbiter OS plugin installed to $OPENCODE_DIR/plugins/arbiter-os.js"
