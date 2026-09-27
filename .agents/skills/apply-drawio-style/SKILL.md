---
name: apply-drawio-style
description: Choose which conventions learn-drawio-style found in the user's own .drawio diagrams this install should draw with - what an edge style means, connector colours, font sizes, text colour, corner rounding - and write them into the per-install style override that build-diagram.mjs merges in. User-invoked only.
disable-model-invocation: true
---

# Apply your learned Draw.io style

`/learn-drawio-style` records what the user's diagrams do. This skill is the
separate, deliberate step that changes what the next diagram looks like on this
install. It only ever runs when the user asks for it.

Plugin root: `${CLAUDE_PLUGIN_ROOT}`. Work from
`${CLAUDE_PLUGIN_ROOT}/skills/arkitect-drawio`.

Everything it reads and writes is in the user's own store, `~/.arkitect/drawio/`
(`$ARKITECT_HOME/drawio/` when that is set): `findings.json` in,
`style-overrides.json` out. The store is outside the plugin, so an update never
wipes it, and nothing in it is ever committed.

## Rules

- **Only what the user chooses.** Never accept a candidate the user did not pick,
  and never accept a batch without walking through each one first.
- **Only contradictions are offered.** `--list` leaves out every finding that
  already matches what a build draws. Do not go looking for more.
- **Tokens and edge kinds only.** An override cannot change which icon or logo
  stands for a product, AWS shape internals, orthogonal routing or arrowheads.
  If the user wants one of those, say that it is not something a style override
  can do.
- **Committed examples are not personal.** Never rebuild anything under
  `assets/templates/` here. Those always build with `--defaults`.

## Steps

1. List the candidates:
   ```bash
   node scripts/apply-style.mjs --list
   ```
   If `candidates` is empty, say so and stop: either nothing the user's diagrams
   do contradicts what is drawn now, or `/learn-drawio-style` has not recorded
   findings yet. If `overrideProblems` is present, the current override is broken
   and not in effect - show the problems and offer `--reset` before anything else.

2. Walk the user through them **one at a time**, in the order `--list` gives
   (strongest first). For each, say what it changes (`id`), the house-style value
   (`shipped`), what is drawn now (`current`), what their diagrams do
   (`proposed`), the `confidence` and `evidence` count, and the `note` if there
   is one. Say plainly when `lowConfidence` is true - a finding seen on two
   diagrams is a hint, not a rule. Recommend accepting or skipping, with one line
   of why. A new edge kind (an `id` such as `edgeKinds.query`) adds a kind specs
   can use; it does not replace `error` or any other shipped kind.

3. Write the chosen ones in one call:
   ```bash
   node scripts/apply-style.mjs --accept edgeKinds.async.meaning,tokens.rounded
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
