# Icons, libraries and logos

Read this when `find-icon.mjs` comes up short, when you need an unnamed library
item, or when the user asks for an icon built from a logo or taken from the
public catalogue. Paths are relative to the skill; scripts are in `scripts/`.

## Resolving

```bash
node scripts/find-icon.mjs "postgres"
node scripts/find-icon.mjs "postgres" --limit 12
node scripts/find-icon.mjs "postgres" --compact          # the verdict alone, under 1KB
node scripts/find-icon.mjs --resolve data-platform:9     # what a spec node would draw
node scripts/find-icon.mjs --stats
```

A node that only names the component is resolved for you, but only to the
product by name — an exact match, a leading Azure/AWS/Google word aside, or a
prefix like `dynamo` for DynamoDB. A name that merely appears inside a different
product's (`postgres` inside "Azure Database for Postgres") never selects that
product. Shared packs may supply the correct mark; otherwise it gets a
placeholder. The search says which up front: `"draws": "<ref>"`, or
`"placeholder": "<why>"`. With `--compact` it prints only that, a spec `node` or
at most four `choices`, and a few `others` (#117).

**Shared packs** fill coverage gaps with 4,843 original SVG/PNG marks from the
sibling Draw.io skill. Existing successful resolutions keep their artwork; use
`"icon": "drawio:databases/postgresql"` to choose a shared mark exactly. Search
and build reports identify these as **embedded**, with source and licence
metadata. They keep captions and arrow bindings editable, but the logo paths are
not Excalidraw strokes. No tracing, recolouring or download occurs. On-demand
entries stay placeholders; integrity failures stop the build. See
`docs/shared-icons.md` in the repository for source terms and examples.

## The bundled libraries

36 libraries, 1,162 items, all native vector geometry — not one embedded image
in the set, so every mark scales, recolours and can be pulled apart in the app.
They cover AWS, Azure, GCP, Snowflake, the data platform stack, DevOps tooling and
general IT logos.

```bash
node scripts/index-libraries.mjs                 # one line per library
node scripts/index-libraries.mjs --items gcp-icons
node scripts/index-libraries.mjs --unnamed       # the ones you have to look at
node scripts/index-libraries.mjs --stats
```

**Unnamed items.** 239 items carry no name and cannot be found by searching.
When a search comes up short, check whether the product is sitting in one of
those libraries unnamed: read the committed contact sheet
`../assets/libraries/bundled/sheets/<slug>.png` and reference the item by number,
`"<slug>:<n>"`.

Reference an item by product name, which searches, or by `<slug>:<n>`, which
does not:

```json
{ "kind": "icon", "icon": "snowflake",   "label": "Snowflake", "col": 0, "row": 0 }
{ "kind": "icon", "icon": "gcp-icons:37", "label": "Pub/Sub",  "col": 1, "row": 0 }
```

- **Many items draw their own name.** Most of the AWS, Azure and data-platform
  marks include the product name as text. The generator detects that and skips
  its own caption; the build report lists those nodes under `icons.selfCaptioned`.
- **Styles differ between libraries.** An AWS mark is a hachure-filled square, a
  GCP mark is flat blue line-art, an IT logo is a black glyph. Prefer one library
  per diagram where the coverage allows it.
- Credits and licences: `../assets/libraries/bundled/ATTRIBUTION.md`. Every
  library belongs to its author.
- Added or removed a `.excalidrawlib`? Rerun
  `node scripts/index-libraries.mjs --build`. A test fails if the index and the
  files disagree.

## Building an icon from a logo

For a product no bundled library covers — and only when the user asks, since a
placeholder is the default answer. `--trace` turns a flat SVG into native
Excalidraw geometry, which is what keeps it consistent with the bundled marks.

```bash
node scripts/make-icon.mjs --url https://.../dbt.svg --name dbt --trace --label "dbt"
node scripts/make-icon.mjs --url https://.../logo.png --name acme
node scripts/make-icon.mjs --file ~/Downloads/logo.svg --name acme --trace
node scripts/make-icon.mjs --list
node scripts/make-icon.mjs --inspect dbt
node scripts/make-icon.mjs --restyle dbt --trace --monochrome --size 96
```

Then reference it in a spec by name:

```json
{ "id": "dbt", "kind": "icon", "icon": "dbt", "label": "dbt", "col": 2, "row": 1 }
```

**Two flavours. Prefer `--trace`.**

- `--trace` converts a flat SVG into native Excalidraw `line` elements. The icon
  becomes real geometry: it takes the hand-drawn stroke, scales cleanly,
  recolours, and can be pulled apart in the app. It needs an SVG, and it is only
  honest for flat vector marks — the tracer reports gradients, clip paths, masks
  and `<text>` rather than losing them silently. If `skipped` comes back
  non-empty, look at the result before shipping it.
- Default (embedded) puts the logo in as an `image` element. Works for SVG, PNG
  and JPEG. SVG remains vector artwork, but its paths are not editable
  Excalidraw strokes and cannot be restyled in the app.

**Customising.** `--size` (longest side, aspect preserved), `--label`,
`--monochrome` (flatten to one colour), `--outline` (no fills — good for a busy
mark), `--stroke #hex`, `--stroke-width`, `--roughness`. `--restyle` re-runs any
of these over bytes already on disk, so changing your mind costs no second
download.

**Finding the file.** Use WebSearch/WebFetch to locate the asset, then hand the
URL to the script — the script does the binary download, not WebFetch. Good
sources, in order: the vendor's own press-kit or brand page; Simple Icons
(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<slug>.svg`) for flat
monochrome marks, which trace perfectly; the vendor's GitHub organisation avatar
or `docs/` assets; Wikimedia Commons.

**Transparency.** Every cached file is checked, and an opaque PNG is warned about
at build time as well. A logo on a baked-in white rectangle looks wrong on the
canvas and worse inside a coloured boundary — go back for a better source rather
than shipping it. SVG plus `--trace` sidesteps the problem entirely.

**Look at it.** Render the diagram and read the PNG back. Brand searches return
old logos, fan art and lookalikes, and a traced logo can come out subtly wrong; a
wrong logo is worse than no logo.

**Privacy.** Only the logo URL is ever requested. Never put a customer name,
project codename, hostname or anything from the diagram into a search query or a
URL — search the product name alone. Downloading a public asset leaks nothing;
searching `"<customer> architecture"` does.

## The public library catalogue

Excalidraw's own libraries — the ones the app's "Browse libraries" button opens —
work here too, when the user asks for one.

```bash
node scripts/browse-libraries.mjs --search "kubernetes"
node scripts/browse-libraries.mjs --search "network" --items
node scripts/browse-libraries.mjs --install slobodan/aws-serverless.excalidrawlib
node scripts/browse-libraries.mjs --list
node scripts/browse-libraries.mjs --show aws-serverless
```

Installed items are searched by `find-icon.mjs` alongside the house icons and
referenced as `library:index` or `library:name`:

```json
{ "id": "fn", "kind": "icon", "icon": "aws-serverless:0", "label": "Lambda" }
```

**Most published libraries are format v1 and carry no item names**, so items
come back as `aws-serverless-0`, `aws-serverless-1` and so on. Do not guess which
is which — render the contact sheet and look:

```bash
node scripts/browse-libraries.mjs --preview aws-serverless --out sheet.excalidraw
node scripts/render-excalidraw.mjs sheet.excalidraw --style clean --out sheet.png
```

Library authors keep their own licence and trademarks. Installed libraries are
cached locally and gitignored.
