---
name: apply-excalidraw-style
description: Choose which conventions learn-excalidraw-style found in the user's own .excalidraw scenes this install should draw with - what a connector style means, connector colour, width and routing, shape stroke width, fill style, corner rounding, boundary strokes - and write them into the per-install style override that build-diagram.mjs merges in. User-invoked only.
disable-model-invocation: true
---

# Apply your learned Excalidraw style

`/learn-excalidraw-style` records what the user's scenes do. This skill is the
separate, deliberate step that changes what the next scene looks like on this
install. It only ever runs when the user asks for it.

Plugin root: `${CLAUDE_PLUGIN_ROOT}`. Work from
`${CLAUDE_PLUGIN_ROOT}/skills/arkitect-excalidraw`.

Everything it reads and writes is in the user's own store,
`~/.arkitect/excalidraw/` (`$ARKITECT_HOME/excalidraw/` when that is set):
`findings.json` in, `style-overrides.json` out. The store is outside the plugin,
so an update never wipes it, and nothing in it is ever committed.

## Rules

- **Only what the user chooses.** Never accept a candidate the user did not pick,
  and never accept a batch without walking through each one first.
- **Only contradictions are offered.** `--list` leaves out every finding that
  already matches what a build draws. Do not go looking for more.
- **Tokens and edge kinds only, in Excalidraw's own vocabulary.** Stroke widths
  are 1, 2 or 4 and font sizes 16, 20, 28 or 36. An override cannot change which
  library item, shared mark or logo stands for a product, arrowheads, arrow
  binding, the placeholder's look or the grid cell. If the user wants one of
  those, say that it is not something a style override can do.
- **Committed examples are not personal.** Never rebuild anything under
  `assets/templates/` here. Those always build with `--defaults`.

## Steps

1. List the candidates:
   ```bash
   node scripts/apply-style.mjs --list
   ```
   If `candidates` is empty, say so and stop: either nothing the user's scenes do
   contradicts what is drawn now, or `/learn-excalidraw-style` has not recorded
   findings yet. If `overrideProblems` is present, the current override is broken
   and not in effect - show the problems and offer `--reset` before anything else.

2. Walk the user through them **one at a time**, in the order `--list` gives
   (strongest first). For each, say what it changes (`id`), the house-style value
   (`shipped`), what is drawn now (`current`), what their scenes do (`proposed`),
   the `confidence` and `evidence` count, and the `note` if there is one. Say
   plainly when `lowConfidence` is true - a finding seen in two scenes is a hint,
   not a rule. Recommend accepting or skipping, with one line of why. A new edge
   kind (an `id` such as `edgeKinds.query`) adds a kind specs can use; it does not
   replace `error` or any other shipped kind.

3. Write the chosen ones in one call:
   ```bash
   node scripts/apply-style.mjs --accept edgeKinds.async.meaning,tokens.boundaryStroke
   ```
   Nothing is written if an id is not a current candidate (exit 2) or the result
   would not be a valid override (exit 1).

4. Report exactly what changed, from the `changed` list: each target, its old
   value and whether that came from the house style or an earlier override, and
   its new value. Then show the style every build now uses:
   ```bash
   node scripts/build-diagram.mjs --print-style
   ```

5. Say how to undo it: `node scripts/apply-style.mjs --reset` returns this
   install to the house style, and a single build ignores the override with
   `--defaults`.
