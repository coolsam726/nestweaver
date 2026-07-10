import type { ScaffoldOptions } from '../types.js';

export function generateTypeormDatabaseModule(
  options: ScaffoldOptions,
): string {
  if (options.orm !== 'typeorm' || !options.database) {
    throw new Error('TypeORM database module requires typeorm ORM and a database');
  }

  if (options.database === 'sqlite') {
    return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_URL?.replace(/^file:/, '') ?? './data/dev.db',
      entities: [Company, User],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Company, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
`;
  }

  const type = options.database === 'postgresql' ? 'postgres' : 'mysql';

  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: '${type}',
      url: process.env.DATABASE_URL,
      entities: [Company, User],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Company, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
`;
}
