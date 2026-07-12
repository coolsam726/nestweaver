import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface LoomRequestContext {
  requestId: string;
  userId?: string;
  resource?: string;
  ability?: string;
}

const loomRequestAls = new AsyncLocalStorage<LoomRequestContext>();

export function currentRequestContext(): LoomRequestContext | undefined {
  return loomRequestAls.getStore();
}

export function currentRequestId(): string | undefined {
  return loomRequestAls.getStore()?.requestId;
}

export function runWithRequestContext<T>(
  context: LoomRequestContext,
  fn: () => T,
): T {
  return loomRequestAls.run(context, fn);
}

export function resolveOrCreateRequestId(
  headers?: Record<string, unknown>,
): string {
  const incoming = headers?.['x-request-id'] ?? headers?.['X-Request-Id'];
  const value = Array.isArray(incoming) ? incoming[0] : incoming;
  if (typeof value === 'string' && value.trim()) {
    return value.trim().slice(0, 128);
  }
  return randomUUID();
}

export function setRequestContextField(
  patch: Partial<Omit<LoomRequestContext, 'requestId'>>,
): void {
  const store = loomRequestAls.getStore();
  if (!store) return;
  Object.assign(store, patch);
}
