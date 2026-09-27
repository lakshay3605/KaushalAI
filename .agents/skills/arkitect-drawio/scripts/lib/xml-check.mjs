// Strict XML 1.0 well-formedness, with Namespaces in XML, for the SVG payloads
// the packs embed (#33).
//
// Draw.io paints a library icon through the browser, and a browser paints
// nothing at all for an SVG image that is not well-formed XML - no error, no
// partial drawing. gRPC and Memcached shipped that way (#29). A regex that
// recognises "looks like an SVG" cannot see a mismatched tag, a raw "&" or an
// undefined entity, so this reads the whole document instead.
//
// It is deliberately never looser than a browser's XML parser, and in a few
// corners stricter: a DOCTYPE may declare plain-text internal entities, but
// parameter entities, external entities and entities whose text holds markup
// are refused as unsupported rather than guessed at. No committed payload uses
// a DOCTYPE at all. Checking only; it builds no tree.

const NAME_START = 'A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF'
  + '\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}';
const NAME_CHAR = `${NAME_START}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040`;
const NAME = new RegExp(`[:${NAME_START}][:${NAME_CHAR}]*`, 'uy');
const NOT_XML_CHAR = /[^\t\n\r\x20-퟿-�\u{10000}-\u{10FFFF}]/u;
const REFERENCE = new RegExp(`&(?:#x([0-9A-Fa-f]+)|#([0-9]+)|([:${NAME_START}][:${NAME_CHAR}]*));`, 'uy');

export const SVG_NS = 'http://www.w3.org/2000/svg';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';
const PREDEFINED = ['lt', 'gt', 'amp', 'apos', 'quot'];

class XmlError extends Error {
  constructor(reason, offset) { super(reason); this.offset = offset; }
}

const isXmlChar = (cp) => cp === 0x9 || cp === 0xA || cp === 0xD || (cp >= 0x20 && cp <= 0xD7FF)
  || (cp >= 0xE000 && cp <= 0xFFFD) || (cp >= 0x10000 && cp <= 0x10FFFF);

// { ok: true, root: { name, local, namespace } } or { ok: false, reason, line, column }.
export function checkXml(text) {
  const src = String(text);
  try {
    return { ok: true, root: parseDocument(src) };
  } catch (error) {
    if (!(error instanceof XmlError)) throw error;
    const before = src.slice(0, error.offset);
    const line = before.split('\n').length;
    return { ok: false, reason: error.message, line, column: error.offset - before.lastIndexOf('\n') };
  }
}

// null when the text is a well-formed SVG document a browser will treat as one,
// otherwise one line saying where and why it is not.
export function svgProblem(text) {
  const result = checkXml(text);
  if (!result.ok) return `line ${result.line}, column ${result.column}: ${result.reason}`;
  const { root } = result;
  if (root.local !== 'svg' || root.namespace !== SVG_NS) {
    return `the root element is <${root.name}>${root.namespace ? ` in ${root.namespace}` : ' in no namespace'}, `
      + `not <svg> in ${SVG_NS}, so a browser will not draw it as an SVG image`;
  }
  return null;
}

// The same for the bytes of a payload. A browser treats bytes that are not the
// encoding the document declares as a fatal error, so they are decoded strictly.
export function svgBytesProblem(bytes) {
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return 'the bytes are not valid UTF-8';
  }
  const declared = /^﻿?<\?xml[^?]*?\sencoding\s*=\s*["']([^"']+)["']/.exec(text)?.[1];
  if (declared && !/^utf-?8$/i.test(declared) && /[^\x00-\x7F]/.test(text)) {
    return `it declares encoding "${declared}" and holds non-ASCII bytes, which are read here as UTF-8`;
  }
  return svgProblem(text);
}

function parseDocument(src) {
  let i = src.charCodeAt(0) === 0xFEFF ? 1 : 0;
  const fail = (reason, at = i) => { throw new XmlError(reason, at); };
  const at = (s) => src.startsWith(s, i);
  const skipSpace = () => {
    const start = i;
    while (i < src.length && (src[i] === ' ' || src[i] === '\t' || src[i] === '\n' || src[i] === '\r')) i++;
    return i > start;
  };
  const readName = (what) => {
    NAME.lastIndex = i;
    const m = NAME.exec(src);
    if (!m) fail(i >= src.length ? `the document ends where ${what} should be` : `expected ${what}`);
    i += m[0].length;
    return m[0];
  };
  const quoted = (what) => {
    const q = src[i];
    if (q !== '"' && q !== "'") fail(`${what} is not quoted`);
    const end = src.indexOf(q, i + 1);
    if (end < 0) fail(`${what} is never closed`);
    const value = src.slice(i + 1, end);
    const start = i + 1;
    i = end + 1;
    return { value, start };
  };

  const bad = NOT_XML_CHAR.exec(src);
  if (bad) fail(`U+${bad[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} is not a character XML allows`, bad.index);

  const entities = new Set(PREDEFINED);

  // Every "&" in text or an attribute value must start a reference XML defines.
  const references = (raw, offset) => {
    for (let amp = raw.indexOf('&'); amp >= 0; amp = raw.indexOf('&', amp + 1)) {
      REFERENCE.lastIndex = amp;
      const m = REFERENCE.exec(raw);
      if (!m) fail('a raw "&" - write it as &amp;', offset + amp);
      if (m[3] !== undefined) {
        if (!entities.has(m[3])) fail(`&${m[3]}; is not an entity XML defines`, offset + amp);
      } else {
        const cp = m[1] !== undefined ? parseInt(m[1], 16) : Number(m[2]);
        if (!isXmlChar(cp)) fail(`${m[0]} does not refer to a character XML allows`, offset + amp);
      }
    }
  };

  const comment = () => {
    const start = i;
    const dashes = src.indexOf('--', i + 4);
    if (dashes < 0) fail('a comment is never closed', start);
    if (src[dashes + 2] !== '>') fail('"--" inside a comment', dashes);
    i = dashes + 3;
  };

  const processingInstruction = () => {
    const start = i;
    i += 2;
    const target = readName('a processing instruction target');
    if (/^xml$/i.test(target)) fail('an XML declaration is only allowed at the very start of the document', start);
    if (target.includes(':')) fail(`processing instruction target "${target}" contains a colon`, start);
    const end = src.indexOf('?>', i);
    if (end < 0) fail('a processing instruction is never closed', start);
    if (end > i && !skipSpace()) fail(`processing instruction "${target}" needs a space before its content`);
    i = end + 2;
  };

  const doctype = () => {
    const start = i;
    i += 9;
    if (!skipSpace()) fail('<!DOCTYPE needs a space before its name');
    readName('a document type name');
    skipSpace();
    if (at('SYSTEM') || at('PUBLIC')) {
      const pub = at('PUBLIC');
      i += 6;
      if (!skipSpace()) fail('a space is required after SYSTEM or PUBLIC');
      quoted(pub ? 'the public identifier' : 'the system identifier');
      if (pub) {
        if (!skipSpace()) fail('a space is required before the system identifier');
        quoted('the system identifier');
      }
      skipSpace();
    }
    if (at('[')) {
      i++;
      for (;;) {
        skipSpace();
        if (i >= src.length) fail('the DOCTYPE internal subset is never closed', start);
        if (at(']')) { i++; break; }
        if (at('<!--')) { comment(); continue; }
        if (at('<?')) { processingInstruction(); continue; }
        if (at('%')) fail('parameter entity references are not supported');
        if (at('<!ENTITY')) {
          i += 8;
          if (!skipSpace()) fail('<!ENTITY needs a space before its name');
          if (at('%')) fail('parameter entities are not supported');
          const name = readName('an entity name');
          if (!skipSpace()) fail(`entity ${name} needs a space before its value`);
          if (at('SYSTEM') || at('PUBLIC')) fail(`external entity ${name} is not supported`);
          const { value, start: valueAt } = quoted(`the value of entity ${name}`);
          const markup = value.search(/[<&%]/);
          if (markup >= 0) fail(`entity ${name} holds markup or references, which is not supported`, valueAt + markup);
          skipSpace();
          if (!at('>')) fail(`<!ENTITY ${name} is not closed with ">"`);
          i++;
          if (!PREDEFINED.includes(name)) entities.add(name);
          continue;
        }
        if (at('<!ELEMENT') || at('<!ATTLIST') || at('<!NOTATION')) {
          while (i < src.length && src[i] !== '>') {
            if (src[i] === '"' || src[i] === "'") quoted('a declaration literal'); else i++;
          }
          if (i >= src.length) fail('a markup declaration is never closed', start);
          i++;
          continue;
        }
        fail('unexpected content in the DOCTYPE internal subset');
      }
      skipSpace();
    }
    if (!at('>')) fail('the DOCTYPE is not closed with ">"', start);
    i++;
  };

  // Comments, processing instructions and whitespace around the root; one
  // DOCTYPE, before it only.
  const misc = (prolog) => {
    let sawDoctype = false;
    for (;;) {
      skipSpace();
      if (at('<!--')) comment();
      else if (at('<?')) processingInstruction();
      else if (prolog && !sawDoctype && at('<!DOCTYPE')) { doctype(); sawDoctype = true; } else return;
    }
  };

  if (at('<?xml') && /[\s?]/.test(src[i + 5] ?? '')) {
    const end = src.indexOf('?>', i);
    if (end < 0) fail('the XML declaration is never closed');
    const decl = src.slice(i + 5, end);
    if (!/^\s+version\s*=\s*(["'])1\.[0-9]+\1(?:\s+encoding\s*=\s*(["'])[A-Za-z][A-Za-z0-9._-]*\2)?(?:\s+standalone\s*=\s*(["'])(?:yes|no)\3)?\s*$/.test(decl)) {
      fail('a malformed XML declaration');
    }
    i = end + 2;
  }
  misc(true);
  if (i >= src.length) fail('there is no root element');
  if (!at('<') || at('</') || at('<!')) fail('expected the root element');

  const BASE_SCOPE = new Map([['xml', XML_NS]]);
  const stack = [];
  let root = null;

  const startTag = () => {
    const tagAt = i;
    i++;
    const qname = readName('an element name');
    const attributes = [];
    for (;;) {
      const spaced = skipSpace();
      if (at('/>') || at('>')) break;
      if (i >= src.length) fail(`the <${qname}> tag is never closed`, tagAt);
      if (!spaced) fail(`attributes of <${qname}> must be separated by whitespace`);
      const attributeAt = i;
      const name = readName(`an attribute name or the end of <${qname}>`);
      skipSpace();
      if (src[i] !== '=') fail(`attribute ${name} on <${qname}> has no value`);
      i++;
      skipSpace();
      const { value, start } = quoted(`the value of attribute ${name}`);
      const lt = value.indexOf('<');
      if (lt >= 0) fail(`a raw "<" in the value of attribute ${name}`, start + lt);
      references(value, start);
      if (attributes.some((a) => a.name === name)) fail(`attribute ${name} appears twice on <${qname}>`, attributeAt);
      attributes.push({ name, value, at: attributeAt });
    }
    const selfClosing = at('/>');
    i += selfClosing ? 2 : 1;

    const parent = stack.length ? stack[stack.length - 1].scope : BASE_SCOPE;
    let scope = parent;
    for (const a of attributes) {
      if (a.name !== 'xmlns' && !a.name.startsWith('xmlns:')) continue;
      if (scope === parent) scope = new Map(parent);
      const prefix = a.name === 'xmlns' ? '' : a.name.slice(6);
      if (prefix === 'xmlns') fail('the xmlns prefix cannot be declared', a.at);
      if (prefix && !a.value) fail(`xmlns:${prefix} cannot be undeclared with an empty value`, a.at);
      if (prefix === 'xml' ? a.value !== XML_NS : a.value === XML_NS) fail('the xml prefix and its namespace belong only to each other', a.at);
      if (a.value === XMLNS_NS) fail(`the xmlns namespace cannot be bound to ${prefix ? `xmlns:${prefix}` : 'the default namespace'}`, a.at);
      scope.set(prefix, a.value);
    }

    const resolve = (qn, attribute, where) => {
      const parts = qn.split(':');
      if (parts.length > 2 || parts.some((p) => !p)) fail(`"${qn}" is not a valid namespaced name`, where);
      if (parts.length === 1) return { local: qn, namespace: attribute ? '' : (scope.get('') ?? '') };
      const [prefix, local] = parts;
      if (prefix === 'xmlns') {
        if (attribute) return { local, namespace: XMLNS_NS };
        fail(`element <${qn}> uses the reserved xmlns prefix`, where);
      }
      if (!scope.has(prefix)) fail(`the "${prefix}:" prefix is used without being declared in scope`, where);
      return { local, namespace: scope.get(prefix) };
    };
    const element = resolve(qname, false, tagAt);
    const expanded = new Set();
    for (const a of attributes) {
      if (a.name === 'xmlns') continue;
      const r = resolve(a.name, true, a.at);
      if (!r.namespace) continue;
      const key = `${r.namespace} ${r.local}`;
      if (expanded.has(key)) fail(`attribute ${a.name} repeats another attribute's namespace and name`, a.at);
      expanded.add(key);
    }

    if (!root) root = { name: qname, ...element };
    if (!selfClosing) stack.push({ name: qname, at: tagAt, scope });
  };

  startTag();
  while (stack.length) {
    const top = stack[stack.length - 1];
    if (i >= src.length) fail(`<${top.name}> is never closed`, top.at);
    const lt = src.indexOf('<', i);
    const textEnd = lt < 0 ? src.length : lt;
    if (textEnd > i) {
      const text = src.slice(i, textEnd);
      const cdataEnd = text.indexOf(']]>');
      if (cdataEnd >= 0) fail('"]]>" in text', i + cdataEnd);
      references(text, i);
      i = textEnd;
      continue;
    }
    if (at('</')) {
      const endAt = i;
      i += 2;
      const name = readName('an element name after "</"');
      skipSpace();
      if (!at('>')) fail(`the end tag </${name}> is malformed`);
      i++;
      stack.pop();
      if (name !== top.name) fail(`</${name}> closes <${top.name}>`, endAt);
    } else if (at('<!--')) {
      comment();
    } else if (at('<![CDATA[')) {
      const end = src.indexOf(']]>', i + 9);
      if (end < 0) fail('a CDATA section is never closed');
      i = end + 3;
    } else if (at('<?')) {
      processingInstruction();
    } else if (at('<!')) {
      fail('a declaration is not allowed inside an element');
    } else {
      startTag();
    }
  }

  misc(false);
  if (i < src.length) fail(at('<') && !at('<!') ? 'a second root element' : 'content after the root element');
  return root;
}
