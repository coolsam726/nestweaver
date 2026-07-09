import type { Database, Orm } from './types.js';

export const ORM_LABELS: Record<Orm, string> = {
  typeorm: 'TypeORM',
  prisma: 'Prisma',
  drizzle: 'Drizzle ORM',
  none: 'None (skip database setup)',
};

export const DATABASE_LABELS: Record<Database, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL / MariaDB',
  sqlite: 'SQLite',
  mongodb: 'MongoDB',
};

export const ORM_DATABASES: Record<Exclude<Orm, 'none'>, Database[]> = {
  typeorm: ['postgresql', 'mysql', 'sqlite'],
  prisma: ['postgresql', 'mysql', 'sqlite', 'mongodb'],
  drizzle: ['postgresql', 'mysql', 'sqlite'],
};

export function databasesForOrm(orm: Orm): Database[] {
  if (orm === 'none') return [];
  return ORM_DATABASES[orm];
}

export function defaultDatabaseUrl(
  database: Database,
  projectName: string,
): string {
  switch (database) {
    case 'postgresql':
      return `postgresql://postgres:postgres@localhost:5432/${projectName.replace(/-/g, '_')}?schema=public`;
    case 'mysql':
      return `mysql://root:root@localhost:3306/${projectName.replace(/-/g, '_')}`;
    case 'sqlite':
      return 'file:./data/dev.db';
    case 'mongodb':
      return `mongodb://localhost:27017/${projectName.replace(/-/g, '_')}`;
  }
}
