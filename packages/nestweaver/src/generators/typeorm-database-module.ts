import type { ScaffoldOptions } from '../types.js';

export function generateTypeormDatabaseModule(
  options: ScaffoldOptions,
): string {
  if (options.orm !== 'typeorm' || !options.database) {
    throw new Error('TypeORM database module requires typeorm ORM and a database');
  }

  const entities = 'Company, User, LoomRole, LoomPermission';
  const imports = `import { Company } from './company.entity';
import { LoomPermission } from './loom-permission.entity';
import { LoomRole } from './loom-role.entity';
import { User } from './user.entity';`;

  if (options.database === 'sqlite') {
    return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
${imports}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_URL?.replace(/^file:/, '') ?? './data/dev.db',
      entities: [${entities}],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([${entities}]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
`;
  }

  const type = options.database === 'postgresql' ? 'postgres' : 'mysql';

  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
${imports}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: '${type}',
      url: process.env.DATABASE_URL,
      entities: [${entities}],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([${entities}]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
`;
}
