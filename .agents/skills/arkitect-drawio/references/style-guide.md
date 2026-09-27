# Style guide

Derived from 5 reference files / 7 pages / 750 cells (585 vertices, 165 edges).
Every rule below carries its evidence count and a confidence level. Machine-readable
form: `source-analysis.json`.

Confidence: **high** = dominant and consistent across files; **medium** = clear
preference with real variation; **low** = weak signal, treat as a hint.

## Type

| | value | evidence | confidence |
|---|---|---|---|
| Body / node captions | `fontSize=12` | 99 declarations | high |
| Section + container headings | `fontSize=16` | 46 declarations | high |
| Text colour | `#232F3E` (AWS squid ink) | 88 of 127 explicit font colours | high |
| Text on filled shapes | `#ffffff` | 18 | high |
| Font family | never set — inherit draw.io's Helvetica | 0 declarations | high |

Only two sizes do real work. 14px and 8px appear once each; treat them as accidents,
not a scale. Headings are bold (`fontStyle=1`) and often UPPERCASE for tier and section
names. Node captions are sentence case.

## Colour

Fills are mostly absent — `fillColor=none` on 225 cells. Colour arrives through service
icons and through stroke colours that carry meaning.

| token | role | evidence |
|---|---|---|
| `#232F3E` | default text, AWS Cloud boundary stroke | 88 |
| `#7AA116` | AWS storage / analytics icons (S3 buckets) | 34 |
| `#ED7100` | AWS compute icons (Lambda, Batch) | 31 |
| `#009900` / `#006600` | current/existing approach, success, "strengths" | 12 |
| `#CC0000` / `#FF0000` | error paths, recovery mode, "weaknesses", open questions | 22 |
| `#E7157B` / `#BC1356` / `#CD2264` | proposed/new approach, Step Functions grouping | 10 |
| `#0050ef` with `#001DBC` stroke | numbered step badges, annotations | 9 |
| `#1ba1e2` / `#00BEF2` with `#006EAF` | swimlane headers, external platform containers | 6 |
| `#E6E6E6` | edge-label background | 15 |
| `#F7F7F7` / `#DFDFDF` | annotation/callout box fill and border | 8 |

The green/red pairing for strengths vs weaknesses and the green/pink pairing for
current vs proposed are used consistently enough to be treated as fixed. **medium-high**

## Shape

- Square corners everywhere: `rounded=0` on 584 cells, `rounded=1` once. **high**
- No shadows: `shadow=0` on 584, once otherwise. **high**
- No sketch styling, no gradients (`gradientColor=none`). **high**
- Containers and boundaries are unfilled; the stroke carries the identity. **medium**

## Icons

- AWS services use built-in `mxgraph.aws4.*` shapes at **75–78px square**
  (75x78 ×19, 68x68 ×13, 78x78 ×12). Generate at **78×78**. **high**
- The bundled palette fills gaps the built-in set lacks — Bedrock AgentCore,
  Timestream, Forecast. Only 20 of 97 embedded image placements come from it, and just
  9 distinct icons; the rest are pasted third-party product logos. **high**
- Third-party logos are embedded bitmaps at larger, irregular sizes (median ~89px).
- Captions sit **below** the icon: `verticalLabelPosition=bottom;verticalAlign=top`,
  centred — 184 of 194 icon cells. **high**
- A caption is often two lines: service or resource name, then a short qualifier.
- Prefer a plain box over an icon for anything that is not a real product: logical
  groupings, external systems, generic actors.

Canonical icon cell:

```
shape=image;html=1;verticalLabelPosition=bottom;verticalAlign=top;labelBackgroundColor=none;
imageAspect=0;aspect=fixed;fontSize=12;fontColor=#232F3E;image=data:image/svg+xml,<base64>;
```

The data URI must use the **comma-only** form. A standard `data:image/svg+xml;base64,…`
URI contains a `;`, which draw.io's style parser treats as a delimiter — the style
silently breaks in half. `find-icon.mjs` handles this.

Canonical built-in AWS service icon:

```
sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#ED7100;
strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;
html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;
resIcon=mxgraph.aws4.lambda;
```

## Connectors

| property | value | evidence | confidence |
|---|---|---|---|
| Routing | `orthogonalEdgeStyle` | 142 of 165 (86%) | high |
| Arrowheads | target end only, filled `classic` | 141 of 165 (86%) | high |
| Weight | `strokeWidth=2` preferred | 78 of 165 (47%); 1 ×46, 3 ×39 | medium |
| Dashed | 39 of 165 (24%) | | high |

Line semantics are deliberate — one reference diagram ships an explicit legend
declaring them:

- **solid black** — primary data or control flow
- **dashed black** — scheduled, asynchronous, or reference/lookup relationship
- **red** — failure, error or exception path
- **green** (often dashed) — success or completion path
- **blue** — a named conditional branch

Include a legend whenever a diagram uses more than one connector kind. **high**

Edge labels are child cells, not values on the edge:

```
edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;labelBackgroundColor=#E6E6E6;
```

Only 17 of 165 connectors are labelled (10%) — label the ones that carry a condition,
a trigger, or a data kind, and leave the obvious ones bare. **medium**

## Layout

- **Reading direction is left to right**: 71 horizontal edges vs 29 vertical (2.45:1).
  Vertical links carry outputs, storage and secondary fan-out. **high**
- **Pitch**: connected nodes sit ~320px apart horizontally (p25 216 / p50 321 / p75 582)
  and ~190px vertically (p25 173 / p50 191 / p75 254). **medium**
- **Canvas is landscape and wide** — pages run 2500–4700px wide against 1100–2800px tall.
- Generous whitespace. Clusters are separated by far more than the intra-cluster pitch.
- Text boxes default to 30px height (`160x30`, `200x18`, `80x30` are common).

**Grid snapping — deliberate deviation.** Only 15% of coordinates land on a 10px
multiple; placement in the references is free-hand and `grid="0"` on most pages
(**high** confidence in the observation). Generated diagrams nonetheless use a clean
320×190 grid, because free-hand placement is not reproducible and risks collisions.
This is the one place the generator knowingly departs from the corpus — say so when
reporting.

## Boundaries

Observed vocabulary is narrow. Do not invent deep VPC/subnet/AZ nesting — it never
appears in these references.

1. **AWS Cloud** — the outer container, holding 94–108 children. Exact style:
   ```
   points=[[0,0],[0.25,0],…];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;
   fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;
   shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;
   fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;
   ```
2. **Step Functions workflow** — same shape with
   `grIcon=mxgraph.aws4.group_aws_step_functions_workflow` and `#CD2264`.
3. **Semantic scope box** — a plain unfilled rectangle, `strokeWidth=3` or `4`, in a
   meaning-carrying colour, label top-left in the same colour, often dashed
   (`dashPattern=8 8`, `12 12`, `8 4 1 4`). This is the workhorse.
4. **Tier swimlane** — `swimlane` with a bold uppercase heading at 16px; used for
   BACKEND / STORAGE / FRONTEND bands. Vertical bands use `horizontal=0;rotation=90`.
5. **Resource container with a filled header bar** — coloured header carrying an icon
   and white text, white body listing contents.

Nesting stays shallow: cloud → scope box → nodes. Two levels, rarely three. **medium**

## Annotation

- **Section heading**: bold text placed *above and left of* the box it names, in the
  box's stroke colour.
- **Assumption / caption box**: light grey fill `#F7F7F7`, border `#DFDFDF`, left-aligned
  12px text, sat beside the thing it explains.
- **Strengths / weaknesses panels**: right-hand column, green-dashed and red-dashed
  boxes, bold coloured title, bold sub-headings with plain body lines under each.
- **Open questions** are written in red directly on the canvas — an "ADR" marker or a
  short red sentence. This is how exploratory work is flagged.
- **Numbered step badges**: filled blue circles (`ellipse;fillColor=#0050ef;
  strokeColor=#001DBC;fontColor=#ffffff;aspect=fixed`) placed on the flow, numbering
  the reading order.

## Exploratory vs presentation-ready

The corpus contains both, and they differ systematically:

| | exploratory | final |
|---|---|---|
| Numbered step badges | yes | no |
| Red "ADR"/open-question notes | yes, many | none |
| Module boundaries | green dash-dot boxes labelled MODULE n | AWS Cloud + tight scope boxes |
| Node labels | UPPERCASE generic ("S3 BUCKET") | concrete service names, sentence case |
| Vendor logos | many third-party products side by side | pruned to what was chosen |
| Density | spread out, alternatives shown side by side | one committed design, tighter |
| Extra pages | scratch pages with a handful of cells | single page |

Ask which register is wanted when it is not obvious; default to presentation-ready.

The one exploratory reference numbered its steps with filled blue circles sat on
the connectors (`ellipse;fillColor=#0050ef;strokeColor=#001DBC;fontColor=#ffffff`),
in reading order. The builder has no badge, and a sequence does not need a new
drawing primitive to keep its meaning: number the edge labels instead —
`"label": "1. Submit request"`, the `numbered-flow` fragment in
`assets/templates/patterns.json`. The circles are recorded here because they are
what the corpus did, not because they are what to draw (#193).
