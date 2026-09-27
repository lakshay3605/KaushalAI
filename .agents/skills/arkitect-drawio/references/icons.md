# Icons and logos

Read this when `find-icon.mjs` is not confident, returns an on-demand or
lifecycle match, or finds nothing; when a product needs its real logo; or when
you need the list of packs. Paths are relative to the skill; scripts are in
`scripts/`.

## Resolving a match

```bash
node scripts/find-icon.mjs "bedrock"                    # rank matches, metadata only
node scripts/find-icon.mjs "bedrock" --compact          # the verdict alone, under 1KB
node scripts/find-icon.mjs "cloud run" --context gcp    # bias toward the stack in play
node scripts/find-icon.mjs kafka --pack streaming-orchestration
node scripts/find-icon.mjs --list-packs
```

The search answers with `confident: true` or with the reason it is not, plus the
alternatives, and never prints icon bytes. Do not take the first row because it
was first. An exact `<pack>/<slug>` is looked up as an id, never searched, so it
draws that mark or nothing; a node that also pins a different `pack` is a
contradiction and is reported instead of resolved (#95).

`--compact` prints one line: a confident answer as its id and a spec `node`,
with an `onDemand` next step or a `lifecycle` caveat when the mark has one; an
unsure one as `needsAChoice` and at most four `choices`, counting the rest
under `more` (#117). A generic word that only a cloud vendor's mark matches
gets a `node` that draws a labelled box, and vendor-neutral `choices` only (#231). The rest of the detail is the same search without it.

`--cell`/`--style`/`--data` print the raw XML cell, style string or data URI for
an icon and exist only for hand-written XML (see `editing.md`). Redirect their
output straight to a file (`> cell.xml`); never read the bytes into the
conversation.

**On-demand marks.** Some catalogued products carry no bundled artwork, because
their marks carry no redistribution licence or their licensed artwork does not
draw at icon size (`--stats` has the live count). They come back as
`bytes: "on-demand"`. With `artwork: "pinned"` they carry the exact `fetch-logo`
command: run it, then use the cached logo. With `artwork: "none pinned"` there is
nothing to fetch: draw a labelled placeholder and name it in the report.

**Lifecycle.** A match with a `lifecycle` block names a product that was
discontinued, renamed, absorbed or acquired. It still resolves, because it is
still that product's entry. Draw it if the system runs it, repeat the `caveat`
in your report, and offer the `successor` when the diagram is a target state. The
build report lists these under `icons.lifecycle`.

**Nothing matches.** Fall back to a built-in `mxgraph.aws4.*` shape, then to the
MCP `search_shapes` tool, then to a plain labelled box that you call out in the
report. **Never** swap in a different product's icon to fill a gap.

## The icon packs

One search covers all of them; `--pack` narrows to one, `--context` biases toward
several and settles a tie between packs that ship one exact title. Lower rank wins a tie, so a curated pack always beats the catch-all.

| Pack | Icons | What is in it |
|---|---|---|
| `aws` | 311 | AWS Architecture Icons, Amazon's July 2026 package |
| `azure` | 638 | Azure service icons, V24 |
| `gcp` | 249 | Google Cloud products and categories |
| `data-platforms` | 31 | Warehouses, lakehouses, query engines, BI, product analytics |
| `databases` | 38 | Relational, document, key-value, graph, vector |
| `ai-frameworks` | 43 | LLM orchestration, agent frameworks, providers |
| `ml-training` | 35 | Training, experiment tracking, the numeric stack |
| `streaming-orchestration` | 23 | Brokers, stream processors, schedulers |
| `observability` | 27 | Metrics, logs, traces, alerting, on-call |
| `devops` | 60 | IaC, CI/CD, containers, mesh, proxies, distros |
| `security-identity` | 32 | Secrets, SSO, scanning, runtime security, VPN |
| `github` | 38 | GitHub marks plus Octicon workflow concepts |
| `saas-collab` | 31 | Trackers, docs, design, comms, low-code, business SaaS |
| `languages-runtimes` | 84 | Languages, frameworks, package managers, build and test tooling |
| `file-types` | 35 | Document sheets badged with an extension |
| `agents` | 33 | Agent concepts — memory, tracing, RAG, guardrail |
| `primitives` | 43 | Generic concepts — queue, cache, load balancer |
| `brands` | 3,092 | Every other Simple Icons mark; ranked last |

`node scripts/find-icon.mjs --list-packs` prints this live.
`pack-index.md` lists what each curated pack contains, and which products are
catalogued without bytes. Contact sheets for every pack are in
`../assets/libraries/contact-sheets/` — look at one before telling a user a pack
is missing something.

## Third-party product logos

The packs cover most things. Everything else — a niche vendor, an internal product,
one of the 160 on-demand marks — gets its real logo, downloaded and embedded.
In the reference corpus 77 of 97 embedded images are exactly this. A generic box where
a recognisable logo belongs is a regression, not a safe default.

```bash
node scripts/fetch-logo.mjs --url https://.../logo.png --name snowflake
node scripts/fetch-logo.mjs --list
node scripts/fetch-logo.mjs --inspect snowflake
```

Then reference it in the spec by name:

```json
{ "id": "sf", "kind": "logo", "logo": "snowflake", "label": "Snowflake", "col": 3, "row": 1 }
```

**Finding the file.** Use WebSearch/WebFetch to locate the official asset, then hand the
URL to the script — the script does the binary download, not WebFetch. Good sources, in
order: the vendor's own press-kit or brand page, their GitHub organisation avatar or
`docs/` assets, Wikimedia Commons. Prefer a page that offers a downloadable asset over
scraping a rendered `<img>` out of a marketing page.

**Prefer transparent PNG, or SVG.** A logo on a baked-in white rectangle looks wrong on
the canvas and worse inside a coloured boundary. The script reports transparency for
every file it caches and warns when a PNG is opaque; if it warns, go back and find a
better source rather than shipping it. Search terms like "transparent png" or "logo svg"
usually get you there. SVG is ideal — it scales and is almost always transparent.

**Size.** Vendor logos sit at ~60–64px in the corpus, smaller than the 78px packaged
service icons. The default fits the longest side to 64px and preserves aspect, so a wide
wordmark stays wide rather than being squashed square. Stack them vertically at ~60px
inside an *external systems column* (pattern 6) when several sit together.

**Check it is the right logo.** Read the cached file back as an image before shipping
it. Brand searches return old logos, fan art and lookalikes; a wrong logo is worse than
no logo.

**Privacy.** Only the logo URL is ever requested. Never put a customer name, project
codename, hostname or anything from the diagram into a search query or URL — search the
product name alone. Downloading a public asset leaks nothing; searching
`"<customer> architecture"` does.

**Embed, never link.** The cache is local and gitignored, so a `remote-url` reference in
a cell would break for anyone else and is flagged by `validate-drawio.mjs`. `kind: "logo"`
embeds the bytes.

If you genuinely cannot find a usable logo, use a plain box with the product name and
say so in the report — do not substitute a different product's mark.

## Maintaining the packs

Not needed to draw. Rebuilding is only needed when `sources.json` changes:

```bash
node scripts/build-packs.mjs --verify        # committed libraries match the manifest?
node scripts/build-packs.mjs --all           # rebuild every pack and the catalog
node scripts/contact-sheet.mjs --all --png   # regenerate the review sheets
```
