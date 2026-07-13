import type { ColumnConfig, ResourceMeta } from './types.js';
import { recordIdFrom } from '../adapters/adapter.js';

export type ExportFormat = 'csv' | 'json';

export function parseExportFormat(value: string | undefined): ExportFormat {
  return value === 'json' ? 'json' : 'csv';
}

export function exportColumns(meta: ResourceMeta): ColumnConfig[] {
  return meta.columns.filter((column) => !column.hiddenOnTable);
}

export function recordsToJson(records: Record<string, unknown>[]): string {
  return JSON.stringify(records, null, 2);
}

export function recordsToCsv(
  records: Record<string, unknown>[],
  columns: Array<{ name: string; label?: string }>,
): string {
  const header = columns.map((col) => escapeCsv(col.label ?? col.name)).join(',');
  const rows = records.map((record) =>
    columns
      .map((col) => {
        const value =
          col.name === 'id' ? recordIdFrom(record) : record[col.name];
        return escapeCsv(formatCsvCell(value));
      })
      .join(','),
  );
  return [header, ...rows].join('\n');
}

export function buildExportFilename(slug: string, format: ExportFormat): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slug}-${stamp}.${format}`;
}

function formatCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(String).join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
