# Pattern catalog

Reusable structures observed across the reference corpus. Each entry says when it
applies, how it is built, and which references it came from (by count, not by name).

Fragments in spec form: `../assets/templates/patterns.json`.
Full worked example: `../assets/templates/starter-architecture.spec.json`.

---

## 1. Left-to-right pipeline inside an AWS Cloud boundary

**Use for**: ingestion, ETL, log processing — anything with a clear source → sink path.
**Seen in**: 4 of 5 references.

External producers sit in a bordered box outside the cloud on the left. The AWS Cloud
boundary wraps everything owned by the account. The main flow runs along one row; storage
and secondary outputs hang below it.

```
[external sources] → ( AWS Cloud: [ingest] → [store] → [index] → [consume] )
                                       ↑                    ↓
                                  [schedule]            [metrics]
```

Build: one `aws-cloud` boundary spanning the flow columns, nodes on row 0, triggers and
outputs on row 1.

---

## 2. Labelled semantic scope box

**Use for**: naming a sub-pipeline, a proposed change, a bounded phase.
**Seen in**: all 5 references, 12+ instances.

An unfilled rectangle, `strokeWidth=3`, in a colour that carries meaning (pink/magenta =
proposed, green = current or success, red = recovery or problem). Label top-left in the
stroke colour. Nest inside the cloud boundary, never more than two deep.

---

## 3. Current vs proposed comparison

**Use for**: solution options, as-is/to-be, migration proposals.
**Seen in**: 2 references.

Two stacked bands, each a full pipeline in a scope box of its own colour, with
a bold heading in that colour **above and left** of it: green for the current
approach, magenta for the proposed one.

- The proposed band often nests mode variants (a green "DELTA RUN", a red
  "RECOVERY RUN"), each with a filled tab label at top-left in white bold.
- A right-hand column holds **Strengths** (green dashed box) and **Weaknesses**
  (red dashed box), with bold sub-headings and plain lines.

The corpus's most distinctive pattern.
On two pages: `../assets/templates/as-is-to-be.spec.json`.

---

## 4. Tiered swimlanes

**Use for**: separating backend / storage / frontend, or on-prem / cloud / consumer.
**Seen in**: 1 reference, used throughout that file.

Top-level bands with bold UPPERCASE 16px headings. Horizontal bands use a normal
`swimlane`; a vertical band on the left uses `horizontal=0;rotation=90` so the title runs
up the edge. Inside each band, coloured resource containers group related services.
A band or container name that collides with a border or a neighbour moves with
`"labelAlign": "center"` or `"right"` on its boundary, never with markup or padding.

---

## 5. Resource container with a filled header bar

**Use for**: a named database, schema, namespace or managed service holding sub-items.
**Seen in**: 2 references.

Coloured header bar (cyan/blue for external platforms, olive for storage) carrying a small
icon and white bold text; white body below listing the contained objects as plain rows.
Reads as a titled card rather than a boundary.

---

## 6. External systems column

**Use for**: upstream producers or downstream consumers you do not own.
**Seen in**: 3 references.

A plain white rectangle with a thin dark border, pinned to the left or right edge outside
the cloud boundary. Bold heading at the top ("Logs producers", "External tools"), vendor
logos stacked vertically below at ~60px. One arrow leaves or enters the column as a whole
rather than one arrow per logo.

The builder picks each edge's sides from the grid. Where it picks wrong, set them on
the edge: `"exit": "bottom"`, `"entry": { "side": "left", "at": 0.25 }` (`at` runs 0
to 1 along the side).

---

## 7. Numbered flow

**Use for**: walking a reader through a sequence during a review.
**Seen in**: 1 reference (exploratory register).

Number the edge labels in reading order — `"label": "1. Submit request"`. The
fragment is `numbered-flow` in `assets/templates/patterns.json`.

A number claims an order, so number one sequence per page, from 1, on edges only.
Entry points and parallel paths are not steps: three ways in stay unnumbered, or
take letters (A, B, C) if they need naming, and the sequence starts where they meet.

A label sits on the longest clear stretch of its edge. To move one, set `"labelPos"`,
from -1 at the source to 1 at the target.

---

## 8. Legend

**Use for**: any diagram with more than one connector kind.
**Seen in**: 1 reference explicitly, and the semantics are consistent across all 5.

Top-right corner. One short connector sample per line with its meaning beside it in 12px
text. The generator adds this automatically when a spec uses multiple edge kinds.

---

## 9. Annotation and open questions

**Use for**: assumptions, decisions still open, warnings.
**Seen in**: all 5 references.

- Assumptions and explanations: light grey callout box (`#F7F7F7` on `#DFDFDF`),
  left-aligned 12px text, placed next to what it describes.
- Open questions and decisions: **red text directly on the canvas**, short, often an
  "ADR" marker. This is the established way unresolved design questions are flagged —
  use it rather than inventing a new convention.

---

## 10. Agentic system layout

**Use for**: LLM agent architectures.
**Seen in**: 2 references.

A dashed boundary labelled with the runtime (e.g. Bedrock AgentCore Runtime) holds the
agents in a row, connected left to right by their handoffs. Agent-to-agent edges carry
short condition labels in red when they represent a failure trigger. Outputs (reports,
metrics) hang below the agent row inside a plain rectangle. Supporting services — memory,
observability, model access, gateway — sit outside the runtime box and connect in with
dashed edges.
