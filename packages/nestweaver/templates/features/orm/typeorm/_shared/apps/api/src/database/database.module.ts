import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: './data/dev.db',
      entities: [Company, User],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Company, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
