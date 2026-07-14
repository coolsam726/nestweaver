import type { ColumnSpan, GridColumns } from './types.js';

export interface GridLayoutOptions {
  columnSpan?: ColumnSpan;
  columnStart?: number;
}

function normalizeSectionColumns(sectionColumns: unknown): number {
  const n = Number(sectionColumns);
  if (Number.isFinite(n) && n >= 1) {
    return Math.floor(n);
  }
  return 2;
}

export function resolveGridItemStyle(
  layout: GridLayoutOptions,
  sectionColumns: GridColumns | number = 2,
): string {
  const cols = normalizeSectionColumns(sectionColumns);
  const start = layout.columnStart;

  if (layout.columnSpan === 'full') {
    if (start && start > 1) {
      return `grid-column: ${start} / -1`;
    }
    return 'grid-column: 1 / -1';
  }

  const span = Math.min(Math.max(layout.columnSpan ?? 1, 1), cols);

  if (start && start > 1) {
    const end = Math.min(start + span, cols + 1);
    return `grid-column: ${start} / ${end}`;
  }

  return `grid-column: span ${span}`;
}
