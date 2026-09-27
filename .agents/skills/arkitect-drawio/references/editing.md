# Editing an existing diagram

Read this before changing a `.drawio` file you did not just build, or before
writing any XML by hand. Paths are relative to the skill; scripts are in
`scripts/`.

## Never load the whole file

Reference pages run 4–7 MB because of embedded images; loading one wholesale
blows the context.

- With the Draw.io MCP server, call `list_pages` first for the page inventory.
  `get_page`/`set_page` are only safe when the page is small.
- For anything large, work page-scoped with the local scripts (pages are 0-based):
  ```bash
  node scripts/analyze-drawio.mjs "<file>" --page 0 --cells   # geometry table, no labels
  node scripts/analyze-drawio.mjs "<file>" --page 0 --images  # embedded image inventory
  node scripts/analyze-drawio.mjs "<file>" --find "Checkout API"  # the cell a name belongs to
  ```
  When the request names a component, `--find` gives its full id, page and
  geometry; never guess an id from `--cells`. Then make a targeted edit and
  re-validate with `validate-drawio.mjs --page N`.
- Never call `open_drawio_xml`, `open_drawio_csv` or `open_drawio_mermaid` on
  anything derived from the user's diagrams — those open the hosted editor and
  would send private architecture off the machine.

## Back it up first

`build-diagram.mjs` backs up for you. Any other route — MCP `set_page`, a script,
a hand edit — means one command before the first write:

```bash
node scripts/backup.mjs "<file>"      # --keep-backups N, 0 keeps all
```

It writes the same timestamped sibling the builder does and prunes to the same
retention. In your own code, `backupExisting()` from `scripts/lib/backups.mjs`.

## Match the file, not the guide

If the existing diagram uses rounded corners or a different palette, so does your
addition. Say in the report that you followed the file.

## Hand-written XML

A narrow exception: only when the spec format genuinely cannot express what you
need, or for a targeted edit like this one — never the way a new diagram gets
built.

- Copy the exact style strings from `style-guide.md`.
- Embedded icons must use the comma-only data URI form
  (`data:image/svg+xml,<base64>`), because `;` terminates a draw.io style.
- Get an icon's cell, style or data URI with `find-icon.mjs --cell`, `--style`
  or `--data`, redirected straight to a file (`> cell.xml`). Never read the
  bytes into the conversation.
- Embed, never link: a `remote-url` image breaks for everyone else and fails
  validation.
