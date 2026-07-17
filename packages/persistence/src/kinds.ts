/**
 * ORM kinds Loom and domain packs share.
 * Keep in sync with `@nodeweaver/loom` `OrmKind` — this package does not depend on Loom.
 */
export type OrmKind = 'typeorm' | 'prisma' | 'drizzle' | 'mongoose';

export const SUPPORTED_ORM_KINDS: readonly OrmKind[] = [
  'typeorm',
  'prisma',
  'drizzle',
  'mongoose',
] as const;

export function assertOrmKind(kind: string): asserts kind is OrmKind {
  if (!SUPPORTED_ORM_KINDS.includes(kind as OrmKind)) {
    throw new Error(
      `Unsupported ORM "${kind}". Expected one of: ${SUPPORTED_ORM_KINDS.join(', ')}`,
    );
  }
}
