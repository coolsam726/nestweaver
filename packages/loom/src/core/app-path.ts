/**
 * Application mount prefix helpers.
 * Empty string = domain root. Non-empty values are normalized to `/segment` (no trailing slash).
 */

export function normalizeAppBasePath(value: unknown): string {
  if (value == null) return '';
  let raw = String(value).trim();
  if (!raw || raw === '/') return '';
  if (!raw.startsWith('/')) raw = `/${raw}`;
  raw = raw.replace(/\/+$/, '');
  // Collapse duplicate slashes (except leave leading single slash)
  raw = raw.replace(/\/{2,}/g, '/');
  return raw === '/' ? '' : raw;
}

/** Join app base with path segments into an absolute path (leading slash, no trailing slash). */
export function joinAppPath(appBasePath: unknown, ...segments: unknown[]): string {
  const base = normalizeAppBasePath(appBasePath);
  const parts: string[] = [];
  for (const segment of segments) {
    if (segment == null) continue;
    const piece = String(segment)
      .trim()
      .replace(/^\/+|\/+$/g, '');
    if (!piece) continue;
    parts.push(...piece.split('/').filter(Boolean));
  }
  if (parts.length === 0) {
    return base || '/';
  }
  const suffix = parts.join('/');
  return base ? `${base}/${suffix}` : `/${suffix}`;
}

/** Nest `@Controller()` path metadata (no leading slash). Empty app base → `''` for root controller. */
export function nestControllerPath(absolutePath: string): string {
  const normalized = absolutePath.replace(/\/+$/, '') || '/';
  if (normalized === '/') return '';
  return normalized.replace(/^\//, '');
}

export function defaultAdminBasePath(appBasePath: unknown): string {
  return joinAppPath(appBasePath, 'admin');
}

export function defaultCookiePath(appBasePath: unknown): string {
  return normalizeAppBasePath(appBasePath) || '/';
}
