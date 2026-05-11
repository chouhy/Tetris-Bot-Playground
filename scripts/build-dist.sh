#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy public shell assets and runtime worker libraries
cp -a "$ROOT_DIR/public/." "$DIST_DIR/"
for path in _cc _cc2 allspin build.emscripten build.emscripten.old; do
  cp -a "$ROOT_DIR/runtime/$path" "$DIST_DIR/$path"
done

# Overlay app sources as the single source of truth
cp -a "$ROOT_DIR/src/." "$DIST_DIR/"

echo "Built dist at: $DIST_DIR"
