#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OPENCODE_DIR="$HOME/.config/opencode"
DEFAULT_REPO_URL="https://github.com/0possum-eth/arbiter-os-v1.git"
PLUGIN_SOURCE="$REPO_ROOT/.opencode/plugins/arbiter-os.js"

mkdir -p "$OPENCODE_DIR/plugins"
mkdir -p "$OPENCODE_DIR/superpowers/.opencode/plugins"

if [ ! -f "$PLUGIN_SOURCE" ]; then
  printf "Missing %s. Clone from %s and retry.\n" "$PLUGIN_SOURCE" "$DEFAULT_REPO_URL" >&2
  exit 1
fi

cp "$PLUGIN_SOURCE" "$OPENCODE_DIR/superpowers/.opencode/plugins/arbiter-os.js"
ln -sf "$OPENCODE_DIR/superpowers/.opencode/plugins/arbiter-os.js" "$OPENCODE_DIR/plugins/arbiter-os.js" || true

echo "Arbiter OS plugin installed to $OPENCODE_DIR/plugins/arbiter-os.js"
