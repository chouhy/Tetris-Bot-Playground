# Tetris Bot Playground

https://chouhy.github.io/Tetris-Bot-Playground/

Allow [TBP](https://github.com/tetris-bot-protocol/tbp-spec) supported bot plays survival mode, which is just something to look at when commuting.

## Source Of Truth

Use `src/` for app code changes.
Use `public/` for entry HTML and shell files.
Use `runtime/` for worker dynamic libraries.
Do not edit `dist/` directly because it is generated.

Worker runtime libraries are copied from:
- `runtime/_cc`
- `runtime/_cc2`
- `runtime/allspin`
- `runtime/build.emscripten`
- `runtime/build.emscripten.old`

## Build Locally

To build the deployable output in `dist/`, run:

```bash
./install.sh
```

## Deploy

Pushing to `master` triggers GitHub Actions in `.github/workflows/static.yml`.
The workflow builds `dist/` from `src/` + `public/` + `runtime/` and deploys to GitHub Pages.

## Cleanup Notes

See `docs/static-cleanup-plan.md` for:
- finalized migration result
- removed legacy static files
- retained runtime library source directories
