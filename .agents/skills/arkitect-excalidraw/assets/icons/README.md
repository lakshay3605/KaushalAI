# Icon store, before 2.1.0

Icons built from real product logos by `make-icon.mjs`, plus the merged
`house.excalidrawlib` you can drag into the Excalidraw container to get them all
in the library sidebar, live in `~/.arkitect/excalidraw/icons/` (or
`$ARKITECT_HOME/excalidraw/icons/`), outside the plugin, so a plugin update keeps
them. They were made here before 2.1.0, and this folder is still read; nothing
new is written here. The layout is the same in both places:

```
index.json              one entry per icon: kind, source URL, dimensions, transparency, digest
<name>.svg|.png         the original bytes, kept so --restyle needs no second download
items/<name>.excalidrawlib   one library item per icon
house.excalidrawlib     every icon, rebuilt on each change
```

**The contents are gitignored.** Product logos carry their own trademark and
licensing terms, and a generated scene embeds or inlines the artwork anyway, so
a diagram stays portable whether or not this cache travels with it. If a
particular icon belongs in a clone of the repository, copy it, its item and its
`index.json` entry here and force-add it:

```bash
git add -f skills/arkitect-excalidraw/assets/icons/dbt.svg
```

Build one with:

```bash
node ../../scripts/make-icon.mjs --url https://.../logo.svg --name product --trace
```

See [docs/icons.md](../../../../docs/icons.md).
