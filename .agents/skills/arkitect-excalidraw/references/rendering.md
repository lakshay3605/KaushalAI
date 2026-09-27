# Rendering and the real app

Read this when a render fails or looks off, or when the user wants to see or
edit the scene in Excalidraw itself. The everyday command is in `SKILL.md`
step 7. Paths are relative to the skill; scripts are in `scripts/`.

## The preview

```bash
node scripts/render-excalidraw.mjs "path/to/architecture.excalidraw" --out-dir .analysis/renders --width 2200
node scripts/render-excalidraw.mjs "path/to/architecture.excalidraw" --out preview.png
node scripts/render-excalidraw.mjs "path/to/architecture.excalidraw" --format svg --out preview.svg
```

`--out-dir` writes `<name>.png` with a local Edge, Chrome or Chromium, on any OS;
pin one with `--browser` or `ARKITECT_BROWSER`. With none installed it says so and
exits 1: install one, or fall back to `--format svg`, which needs no browser, and
say that you could not look at a PNG. Inside another sandbox or a container the
browser may be unable to build its own sandbox; the error then says so and
names `--no-sandbox`, which is the diagnosed failure that flag exists for. `--out` picks the format by extension. The
Windows helper `./scripts/render-excalidraw.ps1 -Path … -OutDir …` keeps its
parameters and is a thin adapter over this renderer, so browser discovery and
`ARKITECT_BROWSER` are the same here as there. A PNG that does not come out
exits non-zero, leaves the previous preview untouched and writes the SVG instead,
rather than reporting a stale image as rendered (#157).

The PNG is geometry-faithful, not pixel-faithful: Excalidraw's fonts are not
installed outside the app, so text is substituted and runs a little wide, and
fills are flat. Judge layout from it, not typography. An SVG is not a preview
in that sense at all — it is markup, which you read rather than see, so it
settles nothing about spacing, collisions or how the diagram reads. `--style clean`
(`-Style clean` in the PowerShell helper) drops the hand-drawn stroke and is
easier to read when the question is whether something collides.

## The local container

The ground truth for appearance: the real app, the real fonts, the real renderer.
Open it when the user wants to see or edit the real thing, and before claiming a
scene looks right in Excalidraw itself.

```powershell
./scripts/excalidraw-docker.ps1 -Up        # http://localhost:3000
./scripts/excalidraw-docker.ps1 -Open -Path scene.excalidraw
./scripts/excalidraw-docker.ps1 -Library   # reveal the house icon library to drag in
./scripts/excalidraw-docker.ps1 -Status
./scripts/excalidraw-docker.ps1 -Down
```

It is the same static app as excalidraw.com with **no backend** — scenes live in
the browser and in the files on disk, so nothing drawn is uploaded. Two
consequences: there is no server-side save (the `.excalidraw` file is the source
of truth), and the app cannot open a file off the disk by itself, which is why
`-Open` starts the container, opens the browser and reveals the file in Explorer
to drag onto the canvas.

## Renders and pull requests

A render of a real or user scene stays local — never commit it, never attach it
to a PR, never upload it. The committed template PNGs under `assets/templates/`
are the only renders that belong in the repository; refresh them in the same PR
whenever generator output changes (see `docs/maintenance.md`).
