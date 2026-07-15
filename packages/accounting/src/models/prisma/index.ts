import { toPrismaSchemaFragment } from '@nodeweaver/persistence';
import { accountingModelCatalog } from '../catalog.js';

export function accountingPrismaSchemaFragment(header?: string): string {
  return toPrismaSchemaFragment(accountingModelCatalog, header);
}

export const accountingPrismaModels = accountingPrismaSchemaFragment();
