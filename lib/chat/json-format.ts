export function truncate(str: string, max = 200): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function fmtJson(obj: unknown, truncateStrings = false): string {
  if (obj == null) return "null";
  try {
    if (truncateStrings) {
      const walk = (v: unknown): unknown => {
        if (typeof v === "string") return truncate(v, 120);
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === "object") {
          const r: Record<string, unknown> = {};
          for (const k of Object.keys(v as object))
            r[k] = walk((v as Record<string, unknown>)[k]);
          return r;
        }
        return v;
      };
      return JSON.stringify(walk(obj), null, 2);
    }
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
