import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './note.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE as 'postgres' | 'mysql' | 'sqlite') ?? 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Note],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Note]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
