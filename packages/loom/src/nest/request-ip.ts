/** Best-effort client IP for login rate limiting. */
export function clientIpFromRequest(req: {
  ip?: string;
  headers?: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(forwarded) && typeof forwarded[0] === 'string') {
    return forwarded[0].split(',')[0]?.trim() || 'unknown';
  }
  if (typeof req.ip === 'string' && req.ip.trim()) return req.ip.trim();
  if (typeof req.socket?.remoteAddress === 'string') {
    return req.socket.remoteAddress;
  }
  return 'unknown';
}
