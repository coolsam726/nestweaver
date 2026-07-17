import type { ResourceClass } from '@nodeweaver/loom';
import { extendResource } from '@nodeweaver/loom';

/** Bind an ORM model to a pack resource base. */
export function bindResource<T extends ResourceClass>(
  Base: T,
  model: string | (new (...args: never[]) => unknown),
): T {
  return extendResource(Base as never, { model }) as unknown as T;
}

/** Subclass / override a pack resource without forking the package. */
export function extendPackResource<T extends ResourceClass>(
  Base: T,
  overrides: Parameters<typeof extendResource>[1],
): T {
  return extendResource(Base as never, overrides) as unknown as T;
}

/** Wrap a domain store to add hooks without rewriting the ORM adapter. */
export function decorateStore<T extends object>(
  base: T,
  patch: Partial<T> & ThisType<T>,
): T {
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop in patch) {
        const value = (patch as Record<string | symbol, unknown>)[prop];
        if (typeof value === 'function') {
          return (value as (...args: unknown[]) => unknown).bind(
            receiver as T,
          );
        }
        return value;
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(target);
      }
      return value;
    },
  }) as T;
}
