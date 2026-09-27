# Style guide

Derived from a corpus of **9** designated real-world scenes — 3,270 elements, 124
placed images — analysed on 2026-09-08. Every rule below carries the count
behind it. The machine-readable form, with full distributions and per-rule
confidence, is `source-analysis.json` (version 1).

Counts are split by the role an element plays, because whole-scene tallies are
dominated by the hundreds of line segments inside library icons and say nothing
about how anything was drawn. "Authored shapes" means shapes not sitting inside
a group of four or more.

A rule marked *default* below is one the corpus does not settle; it rests on
Excalidraw's own defaults and ordinary practice. Say which is which if asked.

Format details: `excalidraw-format.md`. Layouts: `pattern-catalog.md`.

## The governing idea

Excalidraw is chosen over a formal diagramming tool for a reason: a hand-drawn
architecture reads as a proposal rather than a specification. It invites
argument. Generated output should keep that — sketchy strokes, the built-in
fonts — because a scene that looks mechanically produced loses the one thing the
tool was picked for.

The corollary: precision goes into the *layout*, not the *rendering*. Even
spacing, aligned centre lines, no accidental overlaps, arrows that do not cross
where they need not.

The corpus bears this out. `roughness: 1` on 2,330 of 3,270 elements (71%), and
on 155 of 165 connectors (94%). Nothing is drawn at `roughness: 2` deliberately.

## Type

| | value | evidence |
|---|---|---|
| Node captions | `fontSize: 20` | 25 of 173 authored texts |
| Entity and lane titles | `fontSize: 28` | 53 of 173 — the commonest single size |
| Section headings | `fontSize: 36` | 10 |
| A named region's label | 48–130 | 4 texts above 60px |
| Caption font | family `1`, hand-drawn | 98 of 173 |
| Multi-line body copy | family `6`, Nunito | 63 of 173 |

Two faces, used for different jobs: the hand face for anything that names a
thing, Nunito for the paragraph-shaped text inside a spec card. That split is
consistent across the corpus and is the clearest single signal in it.

Captions are **centred** (113 of 173); body copy is **left-aligned** (60).

The long tail matters: dozens of distinct fractional sizes appear, because text
gets resized by dragging rather than stepped. Generated text should use the
steps — an arbitrary 33.7px is the residue of a drag, not a decision.

Family ids 1/2/3 are the legacy values and are still accepted and remapped by
current builds, which makes them the portable choice. 5/6/7/8 are the current
picker's own ids; the corpus contains both.

## Colour

Structure is near-black; colour is spent on meaning and on brand.

| role | stroke | background | evidence |
|---|---|---|---|
| default / structure | `#1e1e1e` | `transparent` | 90 of 165 connectors; `transparent` on 62 of 108 authored shapes |
| failure, rejection, risk | `#e03131` | `#ffc9c9` | 12 connectors, 1 region |
| the subject under discussion | `#1971c2` | `#a5d8ff` | 8 connectors, 1 region |
| data movement, storage | `#29b5e8` / `#01b0f0` | `transparent` | 26 connectors, 2 regions |
| decisions, warnings | `#f08c00` | `#ffec99` | 4 connectors |
| infrastructure, not yours | `#343a40` | `#e9ecef` | 10 connectors |
| success, healthy | `#2f9e44` | `#b2f2bb` | *default* — the corpus signals success with green fills, not green strokes |

The cyans are the notable departure from Excalidraw's five swatches: they are
Snowflake's blues, reached for whenever the diagram is about moving data. Named
`cyan` and `sky` in the generator.

Rules:

- **Most shapes are unfilled** — `transparent` on 62 of 108, `#ffffff` on 26.
  Fill carries meaning; if everything is filled, nothing is emphasised.
- **A colour means the same thing everywhere in one diagram.** Red is failure or
  it is a team, not both.
- **Canvas stays white** — `#ffffff` in 9 of 9 scenes.
- Both `#000000` (35) and `#1e1e1e` (34) appear on authored shapes. The first
  arrives with pasted library items, the second is Excalidraw's own black.
  Generate `#1e1e1e`; do not "fix" a pasted item to match.

`fillStyle` in the corpus is **hachure** on 64 of 108 authored shapes, ahead of
solid at 34 — but nearly all of those are icons from hachure-drawn libraries
(AWS marks, the dbt and Airflow logos), not boxes anybody chose a fill for. The
generator therefore fills boxes `solid`, which stays legible when a diagram is
scaled into a slide, and leaves a traced icon's own hachure alone. This is the
one place the guide knowingly departs from the top tally; the count is recorded
in `source-analysis.json` so the disagreement stays visible.

## Shape

- `roughness: 1` (artist). `0` for a diagram that has to look final — the corpus
  does this for whole scenes, not for single shapes. `2` never; it is illegible
  small.
- `strokeWidth: 2` on shapes (*default*: the corpus splits 4:56 / 2:34, and the
  4s are again library icons).
- **Corners are a genuine near-tie**: `sharp` 59, rounded `type3` 44. Rounded
  for nodes, sharp for boundaries, which is what the split suggests once the two
  populations are separated.
- **An icon-sized node is a 100×100 square** — 42 of 108 authored shapes, far
  ahead of any other footprint.

Shape vocabulary, kept small on purpose:

| shape | means |
|---|---|
| rounded rectangle | a service, component or process |
| sharp rectangle | a boundary, or something you do not own |
| cylinder | a datastore |
| diamond | a decision or a branch point |
| ellipse | a start or end state |
| actor | a person or an external role |
| icon + caption | a named product |

## Connectors

| | value | evidence |
|---|---|---|
| Stroke width | `4` | 117 of 165 |
| Stroke style | solid | 165 of 165 |
| Roughness | 1 | 155 of 165 |
| Arrowhead | target end only | 163 of 165; no connector has a start arrowhead |
| Routing | **elbow arrows** | 116 of 165 |
| Labels | free text beside the line | 165 of 165 carry no bound label |
| Colour | `#1e1e1e`, else meaning | 90 near-black, 75 coloured |

Two findings contradict what a generator would naturally do, so state them
plainly:

- **Elbow arrows.** `elbowed: true` on 70% of connectors. The app re-routes them
  itself, so corners stay square when a box is dragged — which a pre-computed
  multi-point route does not. They need `roundness: null`, a `fixedPoint` on
  each binding, and the three companion fields `fixedSegments` /
  `startIsSpecial` / `endIsSpecial`. The generator emits all of that;
  `routing: "points"` on an edge opts out.
- **No arrow carries a bound label.** Not one, in 165. Edge captions are free
  text set beside the line — above a horizontal run, to the right of a vertical
  one. An elbow arrow cannot carry a bound label anyway.

Still true, and still the most important thing about generating for Excalidraw:

- **Bind both ends.** 264 of 330 connector ends are bound in the corpus, and the
  15 fully unbound arrows are the ones that will be left behind when a box
  moves. Generated arrows bind both ends, always.
- Label the edges that carry a condition, a trigger or a data kind. Leave the
  obvious ones bare — a diagram where every arrow says "sends data" says
  nothing. Short uppercase verbs (`EXTRACT`, `LOAD`) are the corpus's habit for
  pipeline stages.

Any diagram using more than one connector kind gets a legend; the generator adds
one automatically.

## Layout

- **Left to right.** 99 of 114 bound connector pairs are more horizontal than
  vertical (87%). Downward is for storage, outputs and secondary fan-out.
- Column pitch ~320px, row pitch ~200px — the corpus medians run 283–435
  horizontally and 120–244 vertically.
- A composite node — icon plus caption — occupies roughly 120–210 × 70–190.
  Pasted logos are placed larger, around 200px wide.
- Whitespace between clusters should be clearly larger than the pitch inside
  one. Grouping by proximity does more work than any boundary box.
- Shapes on the same row share a centre line, so connectors run straight.
- Landscape. Architecture reads wide: corpus canvases run to 7,584 × 3,064.

**Nothing is snapped.** `gridSize: 20` is set in all 9 scenes and not one
element lands on a 10px multiple. Placement is free-hand. The generator still
places on a grid — reproducible generation needs one, and the alternative is
collisions — but should not claim the corpus is aligned.

Scenes are working canvases: several diagrams side by side, plus a staging area
of logos and icons not yet wired up. Do not tidy that away when editing one.

## Boundaries

**Regions are dashed rectangles. The corpus contains 21 of them and zero frame
elements.** Frames remain available (`kind: "frame"`) but are not the house
mechanism.

| | value | evidence |
|---|---|---|
| Stroke width | `2` | 13 of 13 |
| Stroke style | dotted 8, dashed 5 | a near-tie; the generator uses dashed |
| Background | `transparent` | 9 of 13 |
| Colour | `#1e1e1e`, or the region's meaning | 9 black, 4 coloured |

Two label placements, both from the corpus:

1. **Inside, top-left, small** — the default. A caption tucked into the corner.
2. **Outside, large, coloured** (`labelPlacement: "outside"`) — a single word set
   clear of the box at 48px or more in the box's own colour, the way a `CI` or
   `CD` region gets named. Striking, and it never collides with the contents.

Either way the label is free text: a bound label would centre itself over
whatever sits in the region.

Regions nest, and overlap where the story needs it — the corpus has a CD region
overlapping a CI region rather than nesting cleanly inside it. Size a region
from its contents, never from the grid.

A third mechanism, and often the best: **proximity and a heading**, no box at
all. Reach for a box only when the grouping is not already obvious.

## Icons

**1,847 grouped vector composites against 124 placed images.** Both are in
active use, for different jobs:

- **Vector icons** — library items and traced marks — for anything structural:
  a datastore, a table, a queue, a cloud service. They restyle with the rest of
  the diagram and scale without going soft.
- **Placed images** for a product's real logo, when the mark itself is the
  point. The corpus pastes 19–24 distinct logos into a large scene, each with a
  caption underneath.

Both get a **caption below, centred** — the dominant free-text placement in
every scene measured. Labels are free text 91% of the time (363 of 397).

A logo often sits on a region's top-left corner, overlapping the outline, to
badge the whole region as belonging to that product. Cheap and effective.

## Annotation

- **Assumptions** go in a note: a rounded rectangle, `#ffec99` fill, `#f08c00`
  stroke, left-aligned text. Write them down; an architecture diagram without
  its assumptions is a drawing.
- **Open questions** in red on the canvas, short.
- **Step markers** — ~60px filled circles in `#099268`, `#e8590c`, `#1595d5`
  dropped onto the flow — appear in the corpus to walk a reader through a
  sequence. Drop them for a finished diagram; they mark work in progress.
- A long horizontal line makes a section divider between two diagrams sharing
  one canvas.
- **Spec cards**: a thin coloured rectangle, the product icon overlapping its
  top-left corner, a large title beside the icon, and left-aligned Nunito body
  lines listing paths or names. The corpus's way of documenting conventions next
  to the architecture that uses them.

## Registers

Ask which is wanted when it is not obvious; default to presentation-ready.

| | exploratory | presentation-ready |
|---|---|---|
| Roughness | 1 | 1, or 0 when it must look settled |
| Open questions in red | many | none |
| Step markers | yes | no |
| Alternatives | side by side | one committed design |
| Labels | generic ("QUEUE") | concrete product and component names |
| Density | spread out | tighter |

## What the corpus does that the generator cannot yet

Recorded so it is not mistaken for a style decision:

- **Spec cards** are assembled by hand; there is no node kind for them.
- **Freedraw** strokes (9 in one scene) — annotation by hand, not generated.
- **Overlapping regions** are reachable only by nesting or by placing two
  boundaries by hand.
- **Logo fetching** produces a traced or embedded icon, not the pasted-PNG
  workflow the corpus uses. Traced is usually better; `make-icon.mjs` without
  `--trace` gets closer to the corpus.
