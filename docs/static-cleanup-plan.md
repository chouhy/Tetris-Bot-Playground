# Static Cleanup Plan

This migration is complete.

## Final structure

- `src/`: app source of truth
- `public/`: entry HTML and shell assets
- `runtime/`: worker dynamic libraries
- `dist/`: generated deploy artifact

## Runtime directories retained

- `runtime/_cc/`
- `runtime/_cc2/`
- `runtime/allspin/`
- `runtime/build.emscripten/`
- `runtime/build.emscripten.old/`

## Legacy removals completed

- Removed top-level duplicate app files from legacy `static/`
- Removed legacy `static/` directory after moving runtime assets to `runtime/`

## Build behavior

`scripts/build-dist.sh` now builds `dist/` from:
- `public/`
- `runtime/`
- `src/` (overlaid as app source of truth)
