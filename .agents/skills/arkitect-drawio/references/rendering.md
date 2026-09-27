# Rendering a diagram

Read this when an export fails, a page comes out wrong, or you need to explain
how rendering works. The everyday command is in `SKILL.md` step 7. Paths are
relative to the skill; scripts are in `scripts/`.

```bash
node scripts/render-drawio.mjs "path/to/diagram.drawio" --out-dir .analysis/renders --width 2200
# Or from the repository root, every page:
node bin/arkitect.mjs drawio render "path/to/diagram.drawio" --all --out-dir .analysis/renders
```

Uses local Draw.io Desktop on Linux, macOS and Windows, with automatic
`xvfb-run -a` wrapping on Linux without a usable `DISPLAY` (none, or a local
`:N` whose X socket is hidden, as in a sandbox) when available. Override
discovery with `--drawio-exe` or `DRAWIO_EXE`. Outputs are
`<base>.p<0-based index>.png`. The PowerShell helper keeps its parameters and
is a thin adapter over this renderer, so it inherits the backup, the restore and
the rule that only a fresh non-empty file counts as a render:
`./scripts/render-drawio.ps1 -Path "path/to/diagram.drawio" -OutDir .analysis/renders`.
Every export leaves a 20px margin round the drawing; `--padding N` changes it,
and `0` crops flush, as Desktop does on its own (`-Padding` in the `.ps1`).
A failed export exits non-zero and never reports a page as rendered, whatever
was at the output path before (#157). `-DrawioExe` now defaults to empty, so
discovery works as it does here; pass it to pin a build.

For a PDF, say for a review board, add `--format pdf`: the same Desktop export
writes `<base>.p<N>.pdf`, one page per file, with its text kept as text. It is a
copy to hand round; the `.drawio` stays the deliverable.

To open a diagram for the user on Windows:
`& 'C:\Program Files\draw.io\draw.io.exe' "<file>"`.

## Pages

Both helpers accept 0-based page numbers. The portable `.mjs` validates N,
copies the selected raw `<diagram>` verbatim with original `<mxfile>`
attributes into a temporary single-page file, exports WITHOUT Desktop's
`--page-index`, and removes the temporary file even on failure. Compressed
payloads remain compressed and byte-identical. Do not guess indexing from
platform or version: Linux arm64 24.7.17 is 0-based, Windows x64 29.0.3 is
1-based. The Windows-original `.ps1` remains unchanged. The opt-in
`--page-index-passthrough` flag is only for debugging Desktop; it passes N
directly on the original file without translating and can select a different
page on a build with different indexing. See `docs/drawio-mcp.md` in the
repository.

## When the export fails

- Judge export success by a fresh non-empty output, not Chromium stderr noise.
  A failed page says why: the exit code or signal and Draw.io's first error.
  Put that reason in your report.
- Extra Electron flags are opt-in: `--disable-gpu` for observed GPU errors,
  `--no-sandbox` only for a diagnosed sandbox failure. Never add them blindly.
- After a host update breaks rendering, report 🔴 and explicitly fall back to
  validate-only until fixed. Never omit the visual check silently.

## Renders and pull requests

A render of a real or user diagram stays local — never commit it, never attach
it to a PR, never upload it. Generator changes need a build, render and visual
inspection before a PR. The deliberate exception is the committed template PNGs
and contact sheets under `assets/`: refresh those in the same PR whenever
generator output changes (see `docs/maintenance.md`); only those public,
template-derived renders may be attached to a PR.
