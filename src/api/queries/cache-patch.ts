/**
 * Pure cache patch helpers (no React / React Native imports, so they are unit-testable).
 */

/** Returns `node` with every `{ id: mediaId, mediaListEntry }` object's entry replaced (structurally shared). */
export function replaceCardEntry(node: unknown, mediaId: number, entry: object | null): unknown {
  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((item) => {
      const r = replaceCardEntry(item, mediaId, entry);
      if (r !== item) changed = true;
      return r;
    });
    return changed ? next : node;
  }
  if (node == null || typeof node !== 'object') return node;
  const obj = node as Record<string, unknown>;
  let out: Record<string, unknown> | null = null;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    let next: unknown;
    if (key === 'mediaListEntry' && obj.id === mediaId) {
      next = entry ? { ...(value as object | null), ...entry } : null;
    } else {
      next = replaceCardEntry(value, mediaId, entry);
    }
    if (next !== value) {
      out ??= { ...obj };
      out[key] = next;
    }
  }
  return out ?? node;
}
