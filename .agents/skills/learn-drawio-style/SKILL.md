---
name: learn-drawio-style
description: Teach the arkitect-drawio skill from additional .drawio examples the user explicitly designates. Builds this install's own style record, findings and notes outside the plugin, where an update cannot wipe them. Never changes what gets drawn - that is apply-drawio-style. User-invoked only.
disable-model-invocation: true
---

# Learn from your own Draw.io diagrams

Folds user-designated `.drawio` files into this install's own style knowledge.
It only ever runs when the user asks for it — never learn from a diagram just
because you happened to read one.

Plugin root: `${CLAUDE_PLUGIN_ROOT}`. Work from
`${CLAUDE_PLUGIN_ROOT}/skills/arkitect-drawio`.

**Where it goes.** Everything this skill writes lives in the user's store,
`~/.arkitect/drawio/` (`$ARKITECT_HOME/drawio/` when that is set) — outside the
plugin, so a plugin update or reinstall never wipes it:

| file | what |
|---|---|
| `source-analysis.json` | the evidence record, built from the designated files only |
| `sources.json` | the designated paths, written by `build-knowledge.mjs` |
| `findings.json` | what the corpus says, for `/apply-drawio-style` |
| `style-notes.md` | prose: only where these diagrams differ from the shipped guide |
| `patterns.md` | prose: recurring layouts the shipped catalog lacks |
| `renders/` | scratch renders of the examples |

The shipped `references/` files are the house style. This skill never edits
them, never edits a script, and never rebuilds a committed example.

## Rules

- **Read-only.** Never modify, rename, move or reformat an example. Record its SHA-256
  before and after and confirm they match.
- **Explicit designation only.** The user names the files. Do not scan directories for
  candidates.
- **Nothing confidential enters the plugin.** Labels, file names, paths, hostnames,
  URLs and business strings stay out of it. `build-knowledge.mjs` enforces this for the
  record — structural statistics, style tokens and digests only.
- **Learning never changes the drawing.** It records evidence. What gets drawn changes
  only when the user runs `/apply-drawio-style` and chooses.
- **Preserve prior knowledge.** Use `--merge` so the record keeps its version history
  instead of being replaced.

## Steps

0. **Earlier designations.** If the store has no `sources.json` but
   `${CLAUDE_PLUGIN_ROOT}/.analysis/sources.local.json` exists, it lists files
   designated before the store existed. Offer to include its `drawio` paths in this
   run. Only copy the paths — never move or delete that file: in a git checkout it is
   also the test suite's corpus.

1. Confirm each path exists and record hashes:
   ```bash
   sha256sum "<example.drawio>"
   ```

2. Summarize it without pulling XML into context, and sanity-check the page inventory:
   ```bash
   node scripts/analyze-drawio.mjs "<example.drawio>" --out /tmp/new-example.json
   ```

3. Look at it. Render and inspect the image before drawing conclusions about layout:
   ```bash
   node scripts/render-drawio.mjs "<example.drawio>" --all --out-dir "$HOME/.arkitect/drawio/renders"
   ```

4. Rebuild the record over the whole corpus — every designated file, including the
   ones already in `sources.json`:
   ```bash
   node scripts/build-knowledge.mjs --sources <every example path> --merge
   ```
   This writes `source-analysis.json` and `sources.json` in the store, bumps `version`,
   appends to `history`, and recomputes every convention's evidence and confidence.

5. Record what the tallies settle:
   ```bash
   node scripts/style-findings.mjs --derive
   ```
   It compares body and heading font size, text colour and corner rounding with the
   house style.

6. Record what only looking settles. For each convention the diagrams contradict and a
   style override can express — what a connector style means (a legend is the best
   evidence), a connector's colour, dash or weight, a note or scope colour — add one
   finding, with how many of the diagrams show it:
   ```bash
   node scripts/style-findings.mjs --add edgeKinds.async.meaning --observed "file transfer" --evidence 4 --confidence medium --note "legend on 4 of 5 files"
   node scripts/style-findings.mjs --add edgeKinds.query --observed '{"stroke":"#CC0000","dashed":0,"width":2,"meaning":"SQL query"}' --evidence 3 --confidence medium
   ```
   When the diagrams give a colour or dash a meaning that a shipped kind already uses
   for something else, record a **new** kind: red `error` stays the failure path, and a
   red "SQL query" line is `edgeKinds.query`. Confidence is `high` when every diagram
   agrees, `medium` for a clear majority, `low` for one or two. Keep a meaning generic —
   the kind of data or trigger, never a customer, system or project name. `--list`
   shows every finding; `--remove <target>` drops one that no longer holds. Which icon
   or logo stands for a product is never a finding.

7. Update the user's prose where the evidence actually moved:
   - `style-notes.md` — only rules where these diagrams differ from
     `references/style-guide.md`, each with its counts. The drawing skill reads it after
     the shipped guide, and it wins where they conflict.
   - `patterns.md` — a genuinely new recurring pattern.
   Do not restate a convention whose confidence did not change. If a new example
   contradicts earlier evidence, record both readings and lower the confidence rather
   than silently rewriting history.

8. Report: what was learned, which conventions changed confidence, which contradicted
   the house style or earlier evidence — and that none of it changes a diagram until the
   user runs `/apply-drawio-style`.

## Maintaining the shipped house style

Only for a maintainer changing this repository in a reviewed pull request — never part
of a user's learning run. The shipped record is rebuilt from the maintainer's corpus,
listed in the checkout's gitignored `.analysis/sources.local.json`, with an explicit
`--out`:

```bash
node scripts/build-knowledge.mjs --sources <files> --merge --out references/source-analysis.json
```

Then follow `docs/maintenance.md`: update `references/style-guide.md`, move the
convention in `build-diagram.mjs` too (invariant 9), rebuild the committed example with
`--defaults`, look at its PNG, and run `node tests/run-tests.mjs`.
