/** Entity class, Prisma delegate name, Drizzle table key, or Mongoose model name. */
export type ModelRef = string | (new (...args: never[]) => unknown) | object;

export function modelRefKey(ref: ModelRef): string {
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'function' && ref.name) return ref.name;
  if (ref && typeof ref === 'object' && 'name' in ref) {
    const name = (ref as { name?: unknown }).name;
    if (typeof name === 'string' && name) return name;
  }
  throw new Error('Cannot resolve model key from ModelRef');
}

/**
 * Normalize a persisted row into a plain object with string `id`.
 * Handles TypeORM entities, Mongoose docs (`_id` / `toObject`), and plain records.
 */
export function toPlainRecord(value: unknown): Record<string, unknown> {
  if (value == null || typeof value !== 'object') {
    return {};
  }
  const raw = value as Record<string, unknown> & {
    toObject?: (opts?: unknown) => Record<string, unknown>;
    toJSON?: () => Record<string, unknown>;
  };
  let obj: Record<string, unknown>;
  if (typeof raw.toObject === 'function') {
    obj = raw.toObject({ virtuals: true });
  } else if (typeof raw.toJSON === 'function') {
    obj = raw.toJSON();
  } else {
    obj = { ...raw };
  }
  const id = obj.id ?? obj._id;
  if (id !== undefined && id !== null && id !== '') {
    obj.id = String(id);
  }
  return obj;
}

export function recordId(value: Record<string, unknown> | null | undefined): string {
  if (!value) return '';
  const id = value.id ?? value._id;
  if (id === undefined || id === null || id === '') return '';
  return String(id);
}

/** Coerce string ids to number when they look numeric (TypeORM int PKs). */
export function coerceId(id: string): string | number {
  if (/^\d+$/.test(id)) {
    const n = Number(id);
    if (!Number.isNaN(n)) return n;
  }
  return id;
}
