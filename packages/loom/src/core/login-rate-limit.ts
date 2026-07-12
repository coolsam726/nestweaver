export type LoginRateLimitConfig = {
  /** Sliding window length (default: 15 minutes) */
  windowMs?: number;
  /** Max failed attempts per key within the window (default: 10) */
  maxAttempts?: number;
};

export class LoginRateLimitError extends Error {
  readonly statusCode = 429;
  readonly retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super('Too many login attempts. Try again later.');
    this.name = 'LoginRateLimitError';
    this.retryAfterSec = Math.max(1, retryAfterSec);
  }
}

type Bucket = { count: number; resetAt: number };

/**
 * In-memory login attempt limiter (per process).
 * Suitable for single-instance deploys; multi-instance apps should replace via a shared store later.
 */
export class LoginRateLimiter {
  private readonly windowMs: number;
  private readonly maxAttempts: number;
  private readonly buckets = new Map<string, Bucket>();

  constructor(config: LoginRateLimitConfig = {}) {
    this.windowMs = config.windowMs ?? 15 * 60 * 1000;
    this.maxAttempts = config.maxAttempts ?? 10;
  }

  assertAllowed(key: string): void {
    const normalized = key.trim().toLowerCase();
    if (!normalized) return;
    const now = Date.now();
    const bucket = this.buckets.get(normalized);
    if (!bucket) return;
    if (now >= bucket.resetAt) {
      this.buckets.delete(normalized);
      return;
    }
    if (bucket.count >= this.maxAttempts) {
      throw new LoginRateLimitError(Math.ceil((bucket.resetAt - now) / 1000));
    }
  }

  recordFailure(key: string): void {
    const normalized = key.trim().toLowerCase();
    if (!normalized) return;
    const now = Date.now();
    const existing = this.buckets.get(normalized);
    if (!existing || now >= existing.resetAt) {
      this.buckets.set(normalized, { count: 1, resetAt: now + this.windowMs });
      return;
    }
    existing.count += 1;
  }

  recordSuccess(key: string): void {
    this.buckets.delete(key.trim().toLowerCase());
  }
}
