// The Excalidraw house style as named tokens and connector kinds, and the
// per-install override layer on top of them (#90).
//
// Every shipped number is read off the reference corpus; references/
// source-analysis.json holds the counts behind each one. A person's own
// conventions, chosen with apply-style.mjs, live outside the plugin in
// <ARKITECT_HOME>/excalidraw/style-overrides.json. The CLI build merges them in;
// buildDiagram() itself never reads the disk, so a committed example builds the
// same on every machine. How an override is validated, resolved and loaded is
// shared with Draw.io, in arkitect-drawio/scripts/lib/style-layer.mjs.
//
// An override names tokens and edge kinds, never raw element JSON, and only in
// Excalidraw's own vocabulary: its roughness levels, stroke widths, font
// families and size steps, fill and stroke styles. Which library item or logo
// stands for a product, arrowheads, arrow binding, the placeholder's look and
// the grid mechanics (cell, origin) are not tokens and cannot be overridden.

import { PALETTE, CANVAS_BG, FONT, FONT_FAMILY, STROKE_WIDTH, ROUGHNESS } from './excalidraw-core.mjs';
import { styleLayer, COLOUR, MEANING, oneOf, whole } from '../../../arkitect-drawio/scripts/lib/style-layer.mjs';

export const STYLE = Object.freeze({
  roughness: ROUGHNESS.artist,          // 1, in 71% of all elements
  fontFamily: FONT_FAMILY.hand,         // family 1, in 57% of authored text
  bodyFontFamily: FONT_FAMILY.nunito,   // family 6, for multi-line body copy
  strokeWidth: STROKE_WIDTH.bold,
  edgeStrokeWidth: STROKE_WIDTH.extraBold, // 4, on 71% of connectors
  // Near-black connectors unless the colour carries meaning, 90 of 165. The
  // flow and async kinds used to hard-code it (#90).
  edgeColor: PALETTE.black.stroke,
  rounded: true,
  // The fill of box, round, ellipse, diamond, cylinder and actor nodes. The
  // builder used to hard-code it (#90).
  fillStyle: 'solid',
  canvasBackground: CANVAS_BG.white,    // #ffffff, in 9 of 9 scenes
  nodeWidth: 180,
  nodeHeight: 90,
  iconSize: 100,                        // 100x100 is the commonest footprint
  captionSize: FONT.M,                  // 20; 28 for a lane or section title
  captionGap: 10,
  colPitch: 320,                        // median horizontal pitch ~300-385
  rowPitch: 200,                        // median vertical pitch ~120-150
  cell: 100,
  originX: 0,
  originY: 0,
  // Elbow arrows, on 70% of the corpus's connectors. The app re-routes them
  // itself, so they stay square when a box is dragged.
  edgeRouting: 'elbow',
  // Edge captions sit beside the line as free text: not one arrow in the
  // corpus carries a bound label.
  edgeLabelBound: false,
  // Boundaries are dashed rectangles. The corpus contains 21 of them and no
  // frame elements at all.
  boundaryStroke: 'dashed',
  boundaryStrokeWidth: STROKE_WIDTH.bold,
});

// The same object under the name Draw.io's tokens use.
export const T = STYLE;

// Accents the corpus actually reaches for, beyond Excalidraw's five swatches.
export const HOUSE_ACCENTS = Object.freeze({
  cyan: Object.freeze({ stroke: '#29b5e8', bg: 'transparent' }),
  sky: Object.freeze({ stroke: '#01b0f0', bg: 'transparent' }),
  slate: Object.freeze({ stroke: '#343a40', bg: '#e9ecef' }),
  amber: Object.freeze({ stroke: '#fc5d0d', bg: '#ffec99' }),
  teal: Object.freeze({ stroke: '#0b7285', bg: 'transparent' }),
});

// Connector semantics. Excalidraw has no notion of a line "meaning" anything,
// so the meaning has to live in colour and dash and be spelled out in a legend.
// Drawn from the tokens, so a restyled connector colour or width carries through.
export const edgeKindsFor = (t) => ({
  flow: { color: t.edgeColor, strokeStyle: 'solid', width: t.edgeStrokeWidth, meaning: 'primary flow' },
  async: { color: t.edgeColor, strokeStyle: 'dashed', width: t.edgeStrokeWidth, meaning: 'async or scheduled' },
  branch: { color: PALETTE.blue.stroke, strokeStyle: 'solid', width: t.edgeStrokeWidth, meaning: 'conditional branch' },
  error: { color: PALETTE.red.stroke, strokeStyle: 'solid', width: t.edgeStrokeWidth, meaning: 'failure path' },
  success: { color: PALETTE.green.stroke, strokeStyle: 'dashed', width: t.edgeStrokeWidth, meaning: 'success path' },
  data: { color: HOUSE_ACCENTS.cyan.stroke, strokeStyle: 'solid', width: t.edgeStrokeWidth, meaning: 'data movement' },
  light: { color: PALETTE.grey.stroke, strokeStyle: 'dotted', width: STROKE_WIDTH.thin, meaning: 'weak association' },
});

// ---------------------------------------------------------------- rules

const WIDTH = oneOf(Object.values(STROKE_WIDTH));
const STROKE_STYLE = oneOf(['solid', 'dashed', 'dotted']);
const BOOL = oneOf([true, false]);

// bodyFontFamily, cell, originX and originY are fixed by the builder.
export const TOKEN_RULES = Object.freeze({
  roughness: oneOf(Object.values(ROUGHNESS)),
  fontFamily: oneOf(Object.values(FONT_FAMILY)),
  strokeWidth: WIDTH,
  edgeStrokeWidth: WIDTH,
  edgeColor: COLOUR,
  rounded: BOOL,
  // What the preview renderer draws as well as the app.
  fillStyle: oneOf(['solid', 'hachure', 'cross-hatch']),
  canvasBackground: COLOUR,
  nodeWidth: whole(40, 1000),
  nodeHeight: whole(30, 1000),
  iconSize: whole(24, 400),
  captionSize: oneOf(Object.values(FONT)),
  captionGap: whole(0, 100),
  colPitch: whole(100, 2000),
  rowPitch: whole(100, 2000),
  edgeRouting: oneOf(['elbow', 'points']),
  edgeLabelBound: BOOL,
  boundaryStroke: STROKE_STYLE,
  boundaryStrokeWidth: WIDTH,
});

export const EDGE_FIELD_RULES = Object.freeze({ color: COLOUR, strokeStyle: STROKE_STYLE, width: WIDTH, meaning: MEANING });

// Room between neighbouring nodes, so a size or pitch override cannot stack them.
const MIN_GAP = 40;

export const LAYER = styleLayer({
  engine: 'excalidraw',
  label: 'Excalidraw',
  tokens: STYLE,
  tokenRules: TOKEN_RULES,
  edgeKindsFor,
  edgeFieldRules: EDGE_FIELD_RULES,
  crossCheck: (t) => {
    const errors = [];
    const widest = Math.max(t.nodeWidth, t.iconSize);
    const tallest = Math.max(t.nodeHeight, t.iconSize);
    if (t.colPitch < widest + MIN_GAP) {
      errors.push(`tokens.colPitch: ${t.colPitch} leaves less than ${MIN_GAP}px between ${widest}px-wide nodes; use at least ${widest + MIN_GAP}`);
    }
    if (t.rowPitch < tallest + MIN_GAP) {
      errors.push(`tokens.rowPitch: ${t.rowPitch} leaves less than ${MIN_GAP}px between ${tallest}px-tall nodes; use at least ${tallest + MIN_GAP}`);
    }
    return errors;
  },
});

export const {
  SCHEMA_VERSION, ENGINE, EDGE_KINDS, validateOverrides, resolveStyle, overridesPath, loadStyle, loadStyleOrWarn,
  parseTarget, targetErrors, valueAt, shippedAt, sameValue, styleSummary, DEFAULT_STYLE,
} = LAYER;
