---
name: arkitect-excalidraw
description: Create or edit editable Excalidraw (.excalidraw) diagrams — system and application architectures for any cloud or stack, software component and block diagrams, data pipelines, agentic/LLM systems, network and deployment views, flows and decision paths — in a hand-drawn house style, using Excalidraw's own default libraries plus custom icons built from real product logos. Use whenever the request involves an Excalidraw scene or library, a diagram for a README or a whiteboard, a system design, component or block diagram, anything wanted quickly or in a sketchy style, an icon built from a product logo, or an edit to an existing .excalidraw file.
---

# Architecture diagrams in Excalidraw

Produces native, editable `.excalidraw` JSON — never a flattened image, never
Mermaid as the final artifact. Any cloud, any stack. The builder applies the
house style, binds the arrows and embeds the icons; you write a small JSON spec.
Scripts live in `${CLAUDE_PLUGIN_ROOT}/skills/arkitect-excalidraw/scripts`.

## What to read

Read only what the task needs. Every path is relative to this skill.

| Task | Read |
|---|---|
| Draw a new scene | this file, the one pattern you pick in step 2, and one worked example (step 4) |
| Edit an existing `.excalidraw` | `references/editing.md` |
| An item the search cannot find, an unnamed library item, a logo, a public library | `references/icons.md` |
| Rendering fails, or the user wants the real app | `references/rendering.md` |
| Hand-written scene JSON | `references/excalidraw-format.md` |
| A deliberate deviation from the house style, or its evidence | `references/style-guide.md` |

If `~/.arkitect/excalidraw/style-notes.md` or `patterns.md` exist
(`$ARKITECT_HOME/excalidraw/` when set), read them too: they are what
`/learn-excalidraw-style` found in the user's own scenes, and they win over the
shipped guide. Say so in the report.

The builder already draws the corpus's habits: elbow arrows at stroke width 4,
edge captions beside the line, dashed-rectangle regions, captions below shapes.
Do not undo them by hand.

## Workflow

1. **Decide whether to ask** — see Interview first, below. Most requests are
   drawn straight away, with the assumptions stated.

2. **Pick a pattern and state assumptions.** Choose the nearest, then read
   only that `## N.` section of `references/pattern-catalog.md`:
   1 pipeline · 2 scope or trust box · 3 tiers · 4 request with a decision ·
   5 current vs proposed · 6 external systems · 7 one service's inside ·
   8 agentic/LLM · 9 ordered protocol · 10 legend · 11 sources into one store ·
   12 tables inside a product · 13 big phases (CI/CD) · 14 one tool, many
   outputs · 15 naming convention · 16 two diagrams, one canvas · 17 unwired
   components. Prefer 11–17, the corpus's own shapes, when the system fits.
   Spec fragments: `assets/templates/patterns.json`. Write every assumption
   down for the report and, where it matters, a note on the canvas.
   **An assumption fills a gap the user left open; it never overrides a stated
   fact.** Never add, remove or renumber a component they specified: if the
   stated count draws awkwardly, draw the stated count and say the layout is
   tight.

3. **Resolve icons — bundled libraries first.**
   ```bash
   node scripts/find-icon.mjs "postgres" --compact
   ```
   Put the ref from a match in the spec: `"icon": "data-platform:9"`. A node
   that only names its component resolves by product name alone; the search says
   what it would draw (`"draws"`) or why it gets a placeholder. Shared packs fill
   gaps (`"icon": "drawio:databases/postgresql"`). Unnamed library items:
   `references/icons.md`. **Otherwise use a placeholder and move on**:
   `kind: "placeholder"`, or an unresolvable `icon`, draws a dotted `?` slot
   named under `placeholders` in the build report. Do not fetch a logo unless
   asked, and **never** use one product's mark for another.

4. **Build from a spec.** First see which style this install draws with:
   ```bash
   node scripts/build-diagram.mjs --print-style
   node scripts/build-diagram.mjs my-spec.json --out "path/to/architecture.excalidraw"
   ```
   Write the spec next to the output file, never inside this skill's folder.
   With `"source": "override"` (the user's own conventions), pick each edge
   `kind` by its `meaning` there and keep the tokens it changed. A non-empty
   `style.errors` means the override was ignored: tell the user. Never pass
   `--defaults` for a user's scene.

   **Look at one worked example's PNG before writing a spec**, then its spec:
   `assets/templates/starter-architecture.spec.json` for every node and
   connector kind, or `assets/templates/aws-data-platform.spec.json` for a
   large real answer (regions per phase, sublabels, an error lane, assumptions
   on the canvas, fractional `col`/`row`).

   The build writes nothing and lists every problem (exit 1) when an edge or
   parent names something missing or a number is not one (a string `col`, a
   size ≤ 0). Edges connect nodes, not boundaries. Fix the spec; never drop the
   edge. A missing `col` or `row` is 0. The report lists an unknown `kind` under
   `unknownKinds`, a key no part of a spec takes — a node's `style` above all — under
   `unknownFields`, a shape faking a boundary under `looksLikeBoundary`, a
   shape naming a bundled product under `namesAProduct`, and an edge through a
   node it does not connect under `crossings` (move that node): fix each or
   report it; a field the builder dropped never applied. Hand-written JSON only for what
   the spec cannot express: `references/editing.md`.

5. **Never overwrite blind.** The builder backs up an existing file, keeping the
   oldest plus the newest five (`--keep-backups N`, `0` keeps all). Every other
   edit goes `analyze → back up → edit → validate`, and the backup is
   `node scripts/backup.mjs "<file>"` before the first write. Suggest
   `*.backup-*` for the user's `.gitignore`.

6. **Validate.**
   ```bash
   node scripts/validate-excalidraw.mjs "path/to/architecture.excalidraw"
   ```
   Errors block delivery. Warnings are judgement calls: check each one against
   the render.

7. **Render and look at it.**
   ```bash
   node scripts/render-excalidraw.mjs "path/to/architecture.excalidraw" --out-dir .analysis/renders --width 2200
   ```
   Needs a local Edge, Chrome or Chromium; with none it exits 1 — fall back to
   `--format svg`, dropping `--width`, which is PNG-only. Retry with
   `--no-sandbox` only when the error names it. Read the PNG back and
   iterate; a scene that validates but reads badly is not done. The PNG is
   geometry-faithful, not font-faithful: judge layout from it, not typography;
   an SVG is markup you read, not a picture you see, and settles neither. First
   renders nearly always need, in the spec:
   - a long region label overrunning: one or two words, detail in sublabels;
   - a line through a third icon: `"route": "avoid"`; two on one line: `"straight"`.

8. **Open it in the real app** when the user wants to, and before claiming it
   looks right in Excalidraw itself: `references/rendering.md`.

9. **Report.** Write all seven headings out first, in order, then fill them in.
   Each one appears even where it is a single line:

   **File** · **Engine** · **Assumptions** · **Icons** · **Validation** · **Render** · **Deviations**

   **Engine** only when the user named none: what made it Excalidraw rather than
   Draw.io — the audience, the sketch style, the README; never a generic virtue.
   **Assumptions**: every one, asked or not, and any product the user did not
   name. **Icons**: each ref and its source — bundled library, shared pack, a
   logo you built; every placeholder. **Render**: you looked at the PNG, or it
   failed and why; never "rendered" for a render that failed, and never a
   picture you did not see. With only an SVG, say so — spacing and crossings are
   then the validator's findings, quoted as its. **Validation**: each warning
   left, with every id it names, as a defect still there, never "minor" or
   "a few"; each defect seen and left, by page.
   **Deviations** from the guide.
   Offer nothing Arkitect cannot do: there is no PowerPoint or PDF export.

## Interview first

**Ask only what would change the drawing, and only someone who can answer.**
A request that names its components and flows is drawn, not questioned — even
with a product or a source left unnamed: pick the common choice, draw, and list
it under Assumptions.

A diagram is a claim about someone's system; a wrong claim drawn well gets
believed. Ask **one question at a time**, each with your **recommended answer**
and a one-line reason, in dependency order, feeding answers forward. **Never ask
about styling** — that is this skill's job. Skip a branch the request already
answers or that cannot change the drawing:

1. **Purpose and audience** — who reads it, what decision it supports. Everything below depends on it.
2. **Scope** — what is inside, and what is deliberately outside.
3. **Level** — one box per service, container or team; never mixed.
4. **State** — as-is, to-be, or both (two frames or one comparison).
5. **Components by real product name** — "Snowflake", not "the warehouse"; this decides the icons.
6. **Flows** — what moves, which way, sync or event-driven; only those worth an arrow.
7. **Boundaries** — trust, network, ownership, account; they become the containers.
8. **What must be visible** — failure paths, multi-region, HA/DR, a control under review.
9. **Frames** — split by lifecycle stage or audience, not by how much fits.
10. **Unknowns** — agree up front: a stated assumption or a labelled placeholder, never invention.

**Stop when** the remaining unknowns could not change the drawing: a three-box
flow needs two questions, a review-board architecture needs the ladder. Write
the answers down; they are the report's assumptions and the canvas note.

## Safety — always

- The user's scenes stay on the machine. Nothing is uploaded; the local
  Excalidraw container has no backend.
- The only network requests are public logos and the public library catalogue,
  and only when asked. Search the product name alone — never a customer,
  codename, hostname or anything else from the diagram.
- Never read a whole existing scene into context; embedded images run to
  megabytes of base64. `references/editing.md` says how to work on one.

## Non-negotiables

- Editable `.excalidraw` JSON is the deliverable; images embed in the scene's
  `files`, never linked.
- Every arrow bound at both ends, so the diagram survives being dragged around.
- A missing icon is an obvious placeholder named in the report, never another
  product's mark or a grey box passed off as finished.
- Excalidraw's font sizes, stroke widths and palette plus the house accents; a
  product's brand colour where the diagram is about it.
- A legend whenever more than one connector kind is used; assumptions on the
  canvas.
