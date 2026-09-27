# Excalidraw libraries

Two tiers.

```
bundled/            36 libraries, 1,162 items - COMMITTED, the primary source
  index.json        flat index of names and sizes; what a search reads
  authors.json      credits, matched against the public catalogue
  ATTRIBUTION.md    the same, readable
  sheets/*.png      numbered contact sheets for libraries with unnamed items
  <slug>.excalidrawlib

index.json          before 2.1.0: cached copy of the public catalogue  (gitignored)
installed.json      before 2.1.0: what was installed on demand         (gitignored)
<slug>.excalidrawlib                                                    (gitignored)
```

Libraries installed on demand now go to `~/.arkitect/excalidraw/libraries/` (or
`$ARKITECT_HOME/excalidraw/libraries/`), outside the plugin, so a plugin update
keeps them. What was installed here before 2.1.0 is still read; nothing new is
written here.

`bundled/` ships with the plugin so a diagram can be drawn offline and so the
same product always gets the same mark. Its libraries belong to their authors and
remain under their own licences — see `bundled/ATTRIBUTION.md`.

Anything installed on demand is a **cache**, re-installable in one command:

```bash
node ../../scripts/browse-libraries.mjs --search "kubernetes"
node ../../scripts/browse-libraries.mjs --install <source>
```

See [docs/excalidraw-libraries.md](../../../../docs/excalidraw-libraries.md).
