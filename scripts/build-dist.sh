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

# Overlay app sources, but keep HTML shell from public/
find "$ROOT_DIR/src" -mindepth 1 -maxdepth 1 ! -name '*.html' -exec cp -a {} "$DIST_DIR/" \;

# Copy debug.html if it exists
if [ -f "$ROOT_DIR/debug.html" ]; then
  cp -a "$ROOT_DIR/debug.html" "$DIST_DIR/debug.html"
fi

echo "Built dist at: $DIST_DIR"
