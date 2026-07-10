import type { ScaffoldOptions } from '../types.js';
import { defaultDatabaseUrl } from '../database.js';

export function generateEnvExample(options: ScaffoldOptions): string {
  const lines = [
    '# Nest listen port (user-facing in dev and production)',
    'PORT=3000',
    '',
    '# Set to "production" for prod builds / start:prod',
    '# NODE_ENV=production',
    '',
    '# Nest dev proxy to Nuxt (set automatically in apps/api dev script)',
    '# ENABLE_NUXT_PROXY=true',
    '',
    '# Nuxt dev server URL (internal, used by Nest dev proxy)',
    'NUXT_DEV_URL=http://127.0.0.1:3001',
    '',
    '# Absolute API base for Nuxt SSR fetches (Nitro does not route /api/* to Nest)',
    'API_BASE_SERVER=http://127.0.0.1:3000/api',
    '',
  ];

  if (options.orm !== 'none' && options.database) {
    lines.push('# Database');
    lines.push(`DATABASE_URL="${defaultDatabaseUrl(options.database, options.projectName)}"`);
    if (options.orm === 'typeorm') {
      const dbType =
        options.database === 'postgresql'
          ? 'postgres'
          : options.database === 'mysql'
            ? 'mysql'
            : 'sqlite';
      lines.push(`DB_TYPE=${dbType}`);
    }
    lines.push('');
  }

  if (options.queues) {
    lines.push('# Redis (BullMQ)');
    lines.push('REDIS_HOST=127.0.0.1');
    lines.push('REDIS_PORT=6379');
    lines.push('');
  }

  return lines.join('\n');
}
