---
name: arkitect-drawio
description: Create or edit editable Draw.io (.drawio) solution-architecture diagrams in the Arkitect house style, using the bundled icon packs for AWS, Azure, Google Cloud, data platforms, AI frameworks, DevOps, GitHub, file types and agent concepts. Use whenever the request involves a Draw.io/diagrams.net diagram, a solution architecture for a client or a review board, an AWS or cloud architecture diagram, an as-is/to-be or solution-options comparison, a multi-page diagram, a monitoring, data-pipeline or agentic/LLM architecture wanted formally or with vendor icons, or an edit to an existing .drawio file.
---

# Draw.io architecture diagrams

Produces native, editable `.drawio` XML — never a flattened image, never Mermaid
as the final artifact. The builder applies the house style and embeds the icons;
you write a small JSON spec. Scripts live in
`${CLAUDE_PLUGIN_ROOT}/skills/arkitect-drawio/scripts`.

## What to read

Read only what the task needs. Every path is relative to this skill.

| Task | Read |
|---|---|
| Draw a new diagram | this file, the one pattern you pick in step 2, and `assets/templates/starter-architecture.spec.json` with its PNG |
| Two pages, e.g. as-is and to-be | add `assets/templates/as-is-to-be.spec.json` and its PNGs |
| Edit an existing `.drawio` | `references/editing.md` |
| An icon the search cannot settle, a product logo, the pack list | `references/icons.md` |
| Rendering fails, or you must explain how pages export | `references/rendering.md` |
| Hand-written XML, or a deliberate deviation from the house style | `references/style-guide.md` |

If `~/.arkitect/drawio/style-notes.md` or `patterns.md` exist
(`$ARKITECT_HOME/drawio/` when set), read them too: `/learn-drawio-style` found
them in the user's own diagrams, and they win over the shipped guide. Say so in
the report.

## Workflow

1. **Decide whether to ask** — see Interview first, below. Most requests are
   drawn straight away, with the assumptions stated.

2. **Pick a pattern and state assumptions.** Choose the nearest row, then read
   only that `## N.` section of `references/pattern-catalog.md`:

   | # | Use for |
   |---|---|
   | 1 | ingestion, ETL, log processing: a source → sink pipeline inside an AWS Cloud boundary |
   | 2 | naming a sub-pipeline, a proposed change or a phase with a scope box |
   | 3 | solution options, as-is/to-be, migration proposals |
   | 4 | tiered swimlanes: backend / storage / frontend, on-prem / cloud / consumer |
   | 5 | a database, schema, namespace or service holding sub-items |
   | 6 | upstream producers or downstream consumers you do not own |
   | 7 | a numbered sequence to walk a reviewer through |
   | 8 | the legend (generated when more than one connector kind is used) |
   | 9 | assumptions, open decisions, warnings |
   | 10 | an LLM agent architecture |

   Spec fragments for most of them are in `assets/templates/patterns.json`.
   Write every architectural assumption down; it goes in the report and, where
   it matters, in a note on the canvas. **An assumption fills a gap the user
   left open; it never overrides a stated fact.** Never add, remove or renumber
   a component they specified: if the stated count draws awkwardly, draw the
   stated count and say the layout is tight.

3. **Resolve icons — bundled packs first.**
   ```bash
   node scripts/find-icon.mjs "bedrock" --compact          # verdict + spec node, never bytes
   node scripts/find-icon.mjs "cloud run" --context gcp --compact   # bias toward the stack
   ```
   **A result that is not `confident` is a question, not an answer**: pick an id
   deliberately, narrow with `--pack`, or ask; drop `--compact` for every detail.
   Put the id in the spec as `{ "kind": "icon", "icon": "<id>" }`; the builder
   embeds the artwork. An `onDemand` or `lifecycle` note, or no match: follow
   `references/icons.md`. A product the packs do not carry gets its real logo
   (`kind: "logo"`, same file). **Never** use a different product's icon to fill
   a gap; a labelled box named in the report is honest.

4. **Build from a spec.** First see which style this install draws with:
   ```bash
   node scripts/build-diagram.mjs --print-style
   node scripts/build-diagram.mjs my-spec.json --out "path/to/diagram.drawio"
   ```
   Write the spec next to the output file, never inside this skill's folder;
   more than one page is `pages: [{ name, nodes, edges }]`.
   With `"source": "override"` the user applied their own conventions: pick each
   edge `kind` by its `meaning` there, and do not fight the tokens it changed. A
   non-empty `style.errors` in the build report means the override was ignored:
   tell the user. Never pass `--defaults` for a user's diagram.

   Declare the packs in play so ties resolve inside the right stack:
   `{ "context": { "packs": ["gcp", "devops"] } }`; pin one node with its own
   `"pack"`. The build refuses, before writing anything and listing every
   problem (exit 1), a spec whose edges or parents name something that does not
   exist, or whose numbers are not numbers (a string `col`, a size of 0 or
   less). Fix the spec; never drop the edge. A missing `col` or `row` is 0. An
   unknown node or edge `kind` still builds and is listed under `unknownKinds`,
   a key no part of a spec takes — `style` above all — under `unknownFields`,
   a box faking a boundary under `looksLikeBoundary`, a box naming a bundled
   product under `namesAProduct`: fix each or report it,
   and never treat a field the builder dropped as applied. Hand-written XML is only for what the spec cannot
   express — see `references/editing.md`.

5. **Never overwrite blind.** The builder backs up an existing file first and
   keeps the oldest backup plus the newest five (`--keep-backups N`; `0` keeps
   all). Every other edit — MCP `set_page`, a hand edit — goes `analyze → back
   up → edit → validate`, and the backup is `node scripts/backup.mjs "<file>"`
   before the first write. Suggest `*.backup-*` and `.$*.bkp` for the user's
   `.gitignore`.

6. **Validate.**
   ```bash
   node scripts/validate-drawio.mjs "path/to/diagram.drawio"   # --page N for one page
   ```
   Errors must be fixed. Warnings are judgement calls: check each one against
   the render.

7. **Render and look at it.**
   ```bash
   node scripts/render-drawio.mjs "path/to/diagram.drawio" --out-dir .analysis/renders --width 2200
   ```
   Needs local Draw.io Desktop. Read the PNG back as an image and iterate until
   spacing, hierarchy, routing and labels hold up; a diagram that validates but
   reads badly is not done. If the export fails, see `references/rendering.md`;
   if it cannot be fixed, report 🔴 and fall back to validate-only — never skip
   the look silently. A render of a user's diagram stays local.

8. **Open it on request** in Draw.io Desktop or the VS Code extension — the only
   two places a reply may point at. **No hosted-editor URL** (`app.diagrams.net`,
   `draw.io`) belongs in a reply about the user's diagram: offering one in a
   closing sentence is the same act as opening it there.

9. **Report.** Write all seven headings out first, in order, then fill them in.
   Each one appears even where it is a single line:

   **File** · **Engine** · **Assumptions** · **Icons** · **Validation** · **Render** · **Deviations**

   **Engine** only when the user named none: what made it Draw.io rather than
   Excalidraw — the audience, the vendor icons, the pages; never a generic
   virtue. **Assumptions**: every one, asked or not, and any product the user did
   not name. **Icons**: each id and pack; any not confident or not found; logos
   downloaded and from where; lifecycle caveats. **Render**: you looked at the
   PNG, or it failed and why; never "rendered" for a render that failed, and
   never a picture you did not see. With only an SVG, say so — spacing and
   crossings are then the validator's findings, quoted as its.
   **Validation**: each warning left, with every id it names, as a defect still
   there, never "minor" or "a few"; each defect seen and left, by page.
   **Deviations** from the style guide.
   Offer nothing Arkitect cannot do: there is no PowerPoint export,
   and no link to the hosted editor. **Draw.io Desktop** and **the VS Code
   extension** are the two things a reply names, as plain text, never a URL.

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
4. **State** — as-is, to-be, or both (two pages or one comparison).
5. **Components by real product name** — "Snowflake", not "the warehouse"; this picks the packs.
6. **Flows** — what moves, which way, sync or event-driven; only those worth an arrow.
7. **Boundaries** — trust, network, ownership, account; they become the containers.
8. **What must be visible** — failure paths, multi-region, HA/DR, a control under review.
9. **Pages** — split by lifecycle stage or audience, not by how much fits.
10. **Unknowns** — agree up front: a stated assumption or a labelled placeholder, never invention.

**Stop when** the remaining unknowns could not change the drawing: a three-box
flow needs two questions, a review-board architecture needs the ladder. Write
the answers down; they are the report's assumptions and the canvas note.

## Safety — always

- The user's diagrams stay on the machine. Nothing is uploaded.
- With the Draw.io MCP server, use only `list_pages`, `get_page`, `set_page` and
  `search_shapes`. **Never** call `open_drawio_xml`, `open_drawio_csv` or
  `open_drawio_mermaid` on anything derived from the user's content: they open
  the hosted editor and send the architecture off the machine.
- The only network requests are public logos. Search the product name alone —
  never a customer, codename, hostname or anything else from the diagram.
- Never read a whole existing diagram into context; embedded images run to
  megabytes. `references/editing.md` says how to work on one.

## Non-negotiables

- Editable `.drawio` XML is the deliverable; icons and logos embed in the cell.
- Real marks for named products, transparent backgrounds; an honest labelled box
  where none exists, named in the report.
- Orthogonal routing, captions under icons, a legend when more than one
  connector kind is used, assumptions on the canvas.
