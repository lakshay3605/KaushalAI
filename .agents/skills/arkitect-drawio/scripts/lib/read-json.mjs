// Reading JSON a person wrote, in both engines (#156).
//
// Windows PowerShell 5.1's `Set-Content -Encoding UTF8` writes a byte order
// mark, and so do several editors on Windows. A spec saved that way is ordinary
// UTF-8 JSON with U+FEFF in front of it, which JSON.parse refuses - so both
// builders told the user a syntactically valid spec was not valid JSON. The
// style override reader had stripped one for exactly this reason since #89;
// this is that fix, shared, so every entry point answers the same way.
//
// One mark, and only at the very start. A second U+FEFF is a zero-width
// no-break space in the content, not an encoding artefact, and leaving it there
// keeps JSON.parse refusing a file that really is malformed. Nothing else about
// the text is touched, so Unicode in labels survives exactly as written.

import { readFileSync } from 'node:fs';

export function parseJson(text) {
  return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
}

// Throws what JSON.parse and readFileSync throw, so callers keep the one-line
// messages they already build from ENOENT and SyntaxError.
export function readJson(path) {
  return parseJson(readFileSync(path, 'utf8'));
}
