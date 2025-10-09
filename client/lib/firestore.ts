export type JsonLike =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | JsonLike[]
  | { [key: string]: JsonLike };

/**
 * Recursively sanitize a value for Firestore writes by ensuring there are no
 * undefined or null values. Any undefined or null encountered will be replaced
 * with an empty string (""). Arrays and plain objects are traversed deeply.
 * Other primitive values are kept intact.
 */
export function sanitizeForFirestore<T>(value: T): T {
  return sanitizeValue(value) as T;
}

function sanitizeValue(value: any): any {
  if (value === undefined || value === null) return "";

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v));
  }

  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeValue(v);
    }
    return out;
  }

  return value;
}
