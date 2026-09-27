#!/usr/bin/env node
// Turn what your own scenes say into what this install draws (#90).
//
//   node apply-style.mjs --list                 findings that differ from the style in effect
//   node apply-style.mjs --accept <id>[,<id>]   write those into this install's override
//   node apply-style.mjs --reset                back to the shipped house style
//
// Reads <ARKITECT_HOME>/excalidraw/findings.json, which learn-excalidraw-style
// fills through style-findings.mjs, and writes
// <ARKITECT_HOME>/excalidraw/style-overrides.json, which every CLI build merges
// in unless it is given --defaults. It never edits the plugin, the shipped style
// guide or a committed example, and it runs only when the person asks
// (/apply-excalidraw-style). The behaviour is shared with Draw.io, in
// arkitect-drawio/scripts/lib/style-workflow.mjs.

import { LAYER } from './lib/style-tokens.mjs';
import { applyTools } from '../../arkitect-drawio/scripts/lib/style-workflow.mjs';
import { FINDINGS } from './style-findings.mjs';

export const APPLY = applyTools(LAYER, FINDINGS);

export const { listCandidates, applyAccepted, readOverride } = APPLY;

if (process.argv[1] && process.argv[1].endsWith('apply-style.mjs')) APPLY.main(process.argv.slice(2));
