# Editing an existing scene

Read this before changing an `.excalidraw` file you did not just build, or
before writing any scene JSON by hand. Paths are relative to the skill; scripts
are in `scripts/`.

## Never load the whole file

A scene with embedded images runs to megabytes of base64. Summarize it instead:

```bash
node scripts/analyze-excalidraw.mjs "<file>"            # structure and style tokens
node scripts/analyze-excalidraw.mjs "<file>" --cells    # geometry table, no text
node scripts/analyze-excalidraw.mjs "<file>" --images   # embedded image inventory
node scripts/analyze-excalidraw.mjs "<file>" --find "Checkout API"   # the shape a name belongs to
```

When the request names a component, `--find` gives the full id of its shape
(the box a label is bound to, or the mark a caption is grouped with); `--cells`
ids are shortened. Then make a targeted edit and re-validate with
`validate-excalidraw.mjs`.

## Back it up first

`build-diagram.mjs` backs up for you. Any other route means one command before
the first write:

```bash
node scripts/backup.mjs "<file>"      # --keep-backups N, 0 keeps all
```

It writes the same timestamped sibling the builder does and prunes to the same
retention. In your own code, `backupExisting()` from
`scripts/lib/excalidraw-core.mjs`.

## Keep bindings two-sided

An arrow and the shape it binds to each list the other. `repairBindings()` in
the core library fixes imported content; the validator fails a scene where one
side is missing.

## Match the scene, not the guide

If the existing diagram uses `roughness: 0` and sharp corners, so does your
addition. Say in the report that you followed the file rather than the guide.

## Hand-written JSON

A narrow exception: only when the spec format genuinely cannot express what you
need, or for a targeted edit like this one — never the way a new scene gets
built. Read `excalidraw-format.md` first, particularly the parts about relative
arrow points and two-sided bindings.
