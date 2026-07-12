import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface StoredMedia {
  path: string;
  url: string;
  mimeType: string;
  size: number;
  filename: string;
}

export interface LoomStorageAdapter {
  store(input: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    directory?: string;
  }): Promise<StoredMedia>;
  delete?(path: string): Promise<void>;
}

export interface LocalStorageConfig {
  disk: 'local';
  /** Filesystem directory (created if missing). */
  root: string;
  /** URL prefix served by Loom media route (e.g. `/admin/media`). */
  publicUrlPrefix: string;
}

export type LoomStorageOption = LoomStorageAdapter | LocalStorageConfig;

const DEFAULT_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export function resolveStorageAdapter(
  storage: LoomStorageOption | undefined,
): LoomStorageAdapter | null {
  if (!storage) return null;
  if (typeof (storage as LoomStorageAdapter).store === 'function') {
    return storage as LoomStorageAdapter;
  }
  const config = storage as LocalStorageConfig;
  if (config.disk === 'local') {
    return createLocalStorageAdapter(config);
  }
  return null;
}

export function createLocalStorageAdapter(config: LocalStorageConfig): LoomStorageAdapter {
  const root = config.root.replace(/\/$/, '');
  const urlPrefix = config.publicUrlPrefix.replace(/\/$/, '');

  return {
    async store({ buffer, filename, mimeType, directory }) {
      const safeDir = sanitizePathSegment(directory ?? 'uploads');
      const dir = join(root, safeDir);
      await mkdir(dir, { recursive: true });
      const ext = extname(filename) || extFromMime(mimeType);
      const storedName = `${randomUUID()}${ext}`;
      const path = join(safeDir, storedName);
      const fullPath = join(root, path);
      await writeFile(fullPath, buffer);
      return {
        path,
        url: `${urlPrefix}/${path.replace(/\\/g, '/')}`,
        mimeType,
        size: buffer.length,
        filename: basename(filename),
      };
    },
    async delete(path) {
      const safe = sanitizePathSegment(path);
      await unlink(join(root, safe)).catch(() => undefined);
    },
  };
}

export interface MediaFieldLimits {
  accept?: string[];
  maxBytes?: number;
}

export function validateMediaUpload(
  input: { mimeType: string; size: number },
  limits: MediaFieldLimits,
  fieldType: 'file' | 'image',
): void {
  const maxBytes = limits.maxBytes ?? 5 * 1024 * 1024;
  if (input.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${maxBytes} bytes`);
  }
  const allowed =
    limits.accept ??
    (fieldType === 'image' ? DEFAULT_IMAGE_MIMES : undefined);
  if (allowed?.length && !allowed.includes(input.mimeType)) {
    throw new Error(`File type ${input.mimeType} is not allowed`);
  }
}

export function decodeBase64Upload(data: string): Buffer {
  const raw = data.includes(',') ? data.split(',').pop() ?? '' : data;
  return Buffer.from(raw, 'base64');
}

function sanitizePathSegment(value: string): string {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .filter((part) => part && part !== '..' && part !== '.')
    .join('/');
}

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
  };
  return map[mimeType] ?? '';
}
