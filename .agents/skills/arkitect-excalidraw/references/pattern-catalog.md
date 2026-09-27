# Pattern catalog

Reusable layouts. Nothing here is tied to a cloud, a vendor or a domain — pick
the one whose *shape* matches the system, then fill it with whatever the system
is actually made of.

Spec fragments: `../assets/templates/patterns.json`.
Worked examples, each with its built scene and a PNG to look at:
`../assets/templates/starter-architecture.spec.json` (small, one of everything)
and `../assets/templates/aws-data-platform.spec.json` (large and detailed —
patterns 1, 2, 6, 10 and 11 combined into one canvas).

Patterns 1–10 are general starting points. Patterns 11–17 were read off the
reference corpus of 9 scenes and are the shapes that recur in it — prefer those
when the system fits one. `/learn-excalidraw-style` adds more.

---

## 1. Left-to-right pipeline

**For**: ingestion, ETL, request handling, build pipelines — anything with a
clear source → sink path.

Main flow on one row; storage, outputs and error paths hang below it. Producers
you do not own sit outside the boundary on the left, consumers on the right.

```
[sources] → ( boundary: [ingest] → [process] → [store] ) → [consumers]
                              ↓            ↓
                           [dead-letter]  [metrics]
```

The most common architecture shape there is. Start here unless something else
clearly fits better.

---

## 2. Labelled scope box

**For**: naming a sub-pipeline, a bounded context, a proposed change, a trust
boundary.

Dashed unfilled rectangle, `strokeWidth: 2`, in a colour that carries meaning,
label top-left in the same colour. Nest at most two deep — cloud → subsystem →
nodes, rarely further. Beyond that the boxes carry more visual weight than the
components.

The corpus's workhorse: 21 of these and no frames at all. For the large-label
variant see pattern 13.

---

## 3. Tiered frames

**For**: separating frontend / backend / data, or on-prem / cloud / edge, or one
team's surface from another's.

Real Excalidraw frames, named, stacked as horizontal bands. Frames cannot nest,
so this is the *outermost* division; use scope boxes inside them. A frame also
gives you something to export on its own from the app.

Membership follows `parent`, not the drawing: everything a node or a nested
scope draws moves with the frame, captions and sublabels included, and a node
that merely overlaps one is not a member. An edge joins only when both ends do.
A frame parented to a frame is reported under `notes` (#158).

Note the corpus contains **no frames**: bands there are made of dashed
rectangles and of whitespace. Reach for a frame only when you specifically want
the app's frame behaviour — per-frame export, and contents that move with it.

---

## 4. Request path with a decision

**For**: routing, validation, feature flags, retry and fallback logic.

A diamond on the main row with two labelled arrows leaving it: the happy path
continuing right in `branch` blue, the failure dropping to a row below in
`error` red. Name both branches on the arrows — an unlabelled diamond is a
question with no answer.

---

## 5. Current vs proposed

**For**: solution options, as-is/to-be, migration proposals.

Two stacked bands, each a complete pipeline. Heading above and left of each, in
the band's colour: green for what exists, violet or blue for what is proposed.
Right-hand column holds two notes — what the change buys, what it costs — as
green and red bordered boxes.

Reach for this whenever the user is weighing options rather than documenting a
decision already made. Two half-drawn alternatives beat one over-detailed
straw man.

---

## 6. External systems column

**For**: upstream producers or downstream consumers you do not own.

A bordered box outside the boundary, bold heading, product icons stacked
vertically inside it. One arrow leaves or enters the column as a whole rather
than one arrow per logo — the individual wiring is not the point, and n arrows
into one box is where a diagram starts to look like a hairball.

---

## 7. Component / block diagram

**For**: the inside of one service; module structure; a library's architecture.

No flow at all. Nested rectangles showing containment, with interfaces on the
boundary and dependency arrows between blocks. Depth-first: the outer box is the
deployable, the inner boxes are modules.

Reading direction here is top-down (callers above callees), not left-to-right.
Say which convention you used — a dependency arrow pointing the wrong way is the
easiest mistake to make and the hardest to spot.

---

## 8. Agentic / LLM system

**For**: agent architectures.

A dashed boundary named for the runtime holds the agents in a row, connected
left to right by their handoffs. Handoff arrows carry short condition labels;
failure triggers in red. Tools, memory, model access and observability sit
outside the runtime box and connect in with `light` dotted edges — they support
every agent, so drawing one arrow per agent per tool destroys the diagram.
Outputs hang below the agent row.

---

## 9. Sequence-ish flow

**For**: a protocol or handshake where *order* is the point.

Participants as columns across the top, time running down. Excalidraw has no
sequence-diagram support, so this is drawn by hand: an actor or box per column,
a vertical `light` line under each, and horizontal labelled arrows between them
in time order.

Worth the effort only when order genuinely matters. Otherwise pattern 1 says
more in less space.

---

## 10. Legend and annotation

**For**: every diagram with more than one connector kind.

Top-right. One short arrow sample per line with its meaning beside it. The
generator adds this automatically.

Assumptions in a `#ffec99` note near what they qualify. Open questions in red on
the canvas, short. Both matter more than they look: the assumptions are the part
of an architecture diagram that gets argued with, and burying them in chat
instead of on the canvas means they get lost.

---

# From the reference corpus

The seven below are the recurring shapes in the 9 designated scenes. Counts and
tokens are in `source-analysis.json`; the visual conventions are in
`style-guide.md`.

---

## 11. Converging lanes

**For**: several independent sources feeding one store — the corpus's single
most common shape.

Two or three parallel rows, each a short source → extract → load run, all
turning into one warehouse or datastore on the right. Each lane is a different
product, so each node is a logo with a caption beneath. Stage verbs go on the
arrows as short free text in caps: `EXTRACT`, `LOAD`, `TRANSFORM`.

```
[source A] --EXTRACT--> [transform] --LOAD--> [tables] ---.
[source B] --EXTRACT--> [transform] --LOAD--> [tables] ----> ( warehouse ) -> [dashboard]
[source C] --EXTRACT--> [transform] --LOAD--> [tables] ---'
```

Lanes read as independent because of the whitespace between them, not because
of any box. Keep the vertical gap clearly larger than the gap inside a lane.

---

## 12. Badged schema box

**For**: naming the tables, topics or buckets that live inside one product.

A dashed cyan rounded rectangle holding named items as small white rounded
rectangles stacked vertically, each with a bound label. The product's logo sits
on the box's **top-left corner, overlapping the outline**, so the box needs no
written name at all.

Nest a second dashed box inside when the items belong to a sub-grouping. The
corpus does this — cyan outer, black inner.

---

## 13. Region named from outside

**For**: the two or three big phases of a process — `CI` and `CD`, ingest and
serve, build and deploy.

A dashed rectangle in a meaning-carrying colour with its name set **outside the
box**, to the left, at 48px or more, in the box's own colour. Nothing to collide
with, and the word carries as much weight as the region.

Spec: `"labelPlacement": "outside"` on the boundary.

Regions may **overlap** rather than nest — the corpus has a red CD region
overlapping a blue CI region, because the branch that ends CI also begins CD.
Draw the overlap when the phases genuinely share a step.

---

## 14. Radial fan-out from one tool

**For**: a generator, orchestrator or config manager that produces many
artefacts.

The tool in the middle, five or six targets arranged in an arc below and beside
it, one arrow each, no boundary. Its input arrives from above. A short free-text
label to the left of the hub names the run or config that drives it.

Deliberately not a row: the fan makes it obvious the outputs are siblings
produced in one pass, not stages of a pipeline.

---

## 15. Spec card

**For**: recording the naming convention or path layout of a thing next to the
architecture that uses it.

A thin rectangle with a coloured border, the product icon overlapping its
top-left corner, a large hand-font title beside the icon, and left-aligned body
lines in Nunito (family 6) listing the paths, patterns or names. One card per
resource kind, stacked down the canvas.

Assembled by hand — the generator has no node kind for this yet.

---

## 16. Section divider

**For**: two related diagrams sharing one canvas.

A single long horizontal line between them, full width of the wider diagram.
Cheaper than a frame and it reads instantly. The corpus uses it to separate a
CI/CD flow from the storage layout it deploys onto.

---

## 17. Staging area

**For**: work in progress.

A loose grid of logos and library icons, each captioned, sitting to one side or
below the finished diagram — components collected but not yet wired. Every large
scene in the corpus has one.

Worth knowing when **editing** an existing scene: a cluster of unconnected icons
is not stray junk to be tidied away. Leave it alone unless asked.
