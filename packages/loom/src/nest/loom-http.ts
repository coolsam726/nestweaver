/** Shared HTTP redirect helpers for Loom Nest controllers. */

export function safeRedirect(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

export function sendRedirect(
  res: {
    setHeader?: (name: string, value: string) => void;
    header?: (name: string, value: string) => unknown;
    redirect?: ((status: number, url: string) => unknown) | ((url: string, status?: number) => unknown);
    status?: (code: number) => { send?: (body?: unknown) => unknown };
    send?: (body?: unknown) => unknown;
    statusCode?: number;
  },
  url: string,
): void {
  if (typeof res.header === 'function' && typeof res.status === 'function' && !res.setHeader) {
    res.header('Location', url);
    res.status(302).send?.('');
    return;
  }
  if (typeof res.redirect === 'function') {
    try {
      (res.redirect as (status: number, url: string) => unknown)(302, url);
      return;
    } catch {
      // continue
    }
    try {
      (res.redirect as (url: string, status?: number) => unknown)(url, 302);
      return;
    } catch {
      // continue
    }
  }
  if (typeof res.setHeader === 'function') {
    res.statusCode = 302;
    res.setHeader('Location', url);
    res.send?.('');
  }
}

export function queryString(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, String(item));
      }
    } else {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}
