import { toPrismaSchemaFragment } from '@nodeweaver/persistence';
import { erpModelCatalog } from '../catalog.js';

/**
 * Prisma `model` blocks for ERP — paste/merge into `schema.prisma`, then `prisma generate`.
 * Prisma has no runtime model registration API.
 */
export function erpPrismaSchemaFragment(header?: string): string {
  return toPrismaSchemaFragment(erpModelCatalog, header);
}

export const erpPrismaModels = erpPrismaSchemaFragment();
