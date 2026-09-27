# The .excalidraw format

What the generator writes and the validator checks. Everything here was verified
against scenes round-tripped through the app in the local container.

## Scene file

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [ ... ],
  "appState": { "gridSize": null, "viewBackgroundColor": "#ffffff" },
  "files": { "<fileId>": { "mimeType": "image/png", "id": "<fileId>", "dataURL": "data:image/png;base64,...", "created": 0, "lastRetrieved": 0 } }
}
```

`elements` is a flat list — there is no tree. Containment is expressed by three
different references (`containerId`, `frameId`, `groupIds`), and z-order by
array position.

## Every element carries

| field | notes |
|---|---|
| `id` | 21-char nanoid. Must be unique within the scene. |
| `type` | `rectangle` `ellipse` `diamond` `arrow` `line` `text` `image` `freedraw` `frame` `embeddable` |
| `x` `y` `width` `height` `angle` | `angle` is radians |
| `strokeColor` `backgroundColor` | `backgroundColor` is `"transparent"` when unfilled |
| `fillStyle` | `hachure` `cross-hatch` `solid` — only visible when a background is set |
| `strokeWidth` | 1 thin / 2 bold / 4 extra bold |
| `strokeStyle` | `solid` `dashed` `dotted` |
| `roughness` | 0 architect / 1 artist / 2 cartoonist |
| `opacity` | 0–100 |
| `groupIds` | outermost group last; shared ids mean "select together" |
| `frameId` | the frame this belongs to, or `null` |
| `roundness` | `null` for sharp, `{ "type": 3 }` for the UI's round edges |
| `seed` `versionNonce` | integers driving the hand-drawn stroke; a fixed seed redraws identically |
| `index` | fractional key; must sort in the same order as the array |
| `boundElements` | `[{ id, type: "text" \| "arrow" }]` — what is attached to this |
| `isDeleted` `locked` `link` `updated` | |

## Per-type additions

**text** — `text`, `originalText`, `fontSize` (16 / 20 / 28 / 36), `fontFamily`,
`textAlign`, `verticalAlign`, `lineHeight`, `containerId`, `autoResize`.

Excalidraw stores wrapped text in `text` with real newlines and the unwrapped
original in `originalText`.

`fontFamily` has two generations of ids. 1 / 2 / 3 are the legacy values —
hand-drawn, normal, code — and current builds still accept and remap them, which
makes them the portable choice. The current picker writes 5 (Excalifont),
6 (Nunito), 7 (Lilita One), 8 (Comic Shanns). A scene that comes back carrying 6
where you wrote 2 has not been corrupted.

**arrow** / **line** — `points` (relative to the element's `x`/`y`, first is
always `[0,0]`), `startBinding` / `endBinding`
(`{ elementId, focus, gap }`), `startArrowhead` / `endArrowhead`
(`null` `arrow` `triangle` `triangle_outline` `dot` `circle` `circle_outline`
`bar` `diamond` `diamond_outline`), `elbowed`.

### Elbow arrows

`elbowed: true` hands routing to the app, which recomputes the path whenever
either end moves. It is not just a flag — an arrow written this way needs the
full set, taken from arrows the app itself wrote:

```json
{
  "type": "arrow",
  "elbowed": true,
  "roundness": null,
  "fixedSegments": null,
  "startIsSpecial": null,
  "endIsSpecial": null,
  "points": [[0, 0], [320, 0]],
  "startBinding": { "elementId": "…", "focus": 0, "gap": 5, "fixedPoint": [1, 0.5] },
  "endBinding":   { "elementId": "…", "focus": 0, "gap": 5, "fixedPoint": [0, 0.5] }
}
```

- `roundness` **must** be null; an elbow arrow has square corners by definition.
- `fixedPoint` is where the arrow meets the shape in that shape's own normalised
  coordinates: `[0, 0.5]` the middle of its left edge, `[1, 0.5]` the right,
  `[0.5, 0]` the top. The app writes values a little outside 0..1 so the head
  clears the outline; exact edge values are fine to write and get normalised.
- Without a `fixedPoint` on each binding there is nothing to route between, and
  the binding is dropped.
- `points` is only the opening position — the app replaces it, except for a
  run listed in `fixedSegments`: `{ "index": n, "start": points[n-1], "end":
  points[n] }`, never the first or last run. The app keeps a fixed run where it
  is when a node moves and routes the ends to it. That is how the builder's
  `"route": "avoid"` (per edge, or `layout.route` for all) writes a detour
  (#124).
- An elbow arrow **cannot carry a bound label**. Put the caption beside the line
  as free text.

`fixedPoint` must be *absent*, not null, on a plain arrow: an arrow that carries
the field is treated as elbowed.

**image** — `fileId` into the scene's `files` map, `status: "saved"`, `scale`,
`crop`.

**frame** — `name`. Frames are top level: a frame cannot contain another frame.

## The three ways to nest, and when to use which

| mechanism | what it does | use it for |
|---|---|---|
| `containerId` + `boundElements` | text lives inside a shape and reflows with it | node labels, arrow labels |
| `groupIds` | elements select and move as one | composed shapes, traced icons, a legend |
| `frameId` + a `frame` element | a named region that clips and carries its members | top-level bands: tiers, environments, teams |

A dashed rectangle drawn around a cluster is none of these — it is just a
rectangle. That is usually what you want for a boundary that should stay easy to
resize.

## Bindings are stored twice

An arrow names its endpoints, and each endpoint lists the arrow back:

```json
{ "type": "arrow", "startBinding": { "elementId": "abc", "focus": 0, "gap": 6 } }
{ "id": "abc", "boundElements": [ { "id": "<arrow id>", "type": "arrow" } ] }
```

The same holds for bound text. Excalidraw repairs a one-sided binding on load,
but half-bound scenes drift, so the validator treats it as an error and
`repairBindings()` fixes it on any imported content.

`focus` is the offset of the aim point from the shape's centre, from -1 to 1;
`gap` is the clear space left between arrowhead and shape.

## Labels do not get the whole shape

A diamond offers about half its width on the centre line and an ellipse about
1/√2. Wrapping a label to the full bounding box pushes text out through the
sides. Both the label builder and the validator apply those factors.

## Libraries

`.excalidrawlib` comes in two shapes, and **most published libraries are still
version 1**:

```json
{ "type": "excalidrawlib", "version": 1, "library": [ [ /* elements */ ], ... ] }
{ "type": "excalidrawlib", "version": 2, "libraryItems": [ { "id", "status", "created", "name", "elements" } ] }
```

Version 1 items have no name of their own. `libraries.excalidraw.com` sometimes
supplies a positional `itemNames` array, and when it does not, an item can only
be identified by its own caption text or by looking at it — hence
`browse-libraries.mjs --preview`, which lays a library out as a numbered contact
sheet.

Image elements in a library need their bytes too. Not every build reads a
`files` map back out of a library file, so the icon store keeps the original
bytes separately and `build-diagram.mjs` embeds them into the scene, where they
always work.

## Gotchas

- **Points are relative.** An arrow's `x`/`y` is its first point; `points[0]` is
  `[0,0]`. Writing absolute coordinates into `points` moves the arrow twice.
- **Deleted is not gone.** `isDeleted: true` elements stay in the file. Filter
  them before measuring anything.
- **`index` must increase.** Out-of-order keys make Excalidraw rebuild the
  z-order, which can put a filled boundary on top of its own contents.
- **`backgroundColor: "transparent"`, not `"none"`.**
- **A data URL in `files` is the only portable image.** A remote URL breaks for
  anyone else and is flagged.
