// A node that names an icon is an icon. The skills say to put the id in
// `icon`; without `kind: "icon"` as well, the node drew as a plain box and
// nothing said so, while the agent reported the icon it thought it had drawn
// (#228). Both builders read their nodes through this.

export function iconKind(node) {
  return node && typeof node === 'object' && node.kind == null && node.icon != null
    ? { ...node, kind: 'icon' }
    : node;
}

// An icon on a node that names a kind which draws none is dropped; say so.
export function unusedIcon(node, field, drawsIcon) {
  if (!node || node.icon == null || node.kind == null || drawsIcon.includes(node.kind)) return null;
  return `${field}.icon is not drawn: the node's kind is ${JSON.stringify(node.kind)}; `
    + 'leave kind out, or set it to "icon"';
}
