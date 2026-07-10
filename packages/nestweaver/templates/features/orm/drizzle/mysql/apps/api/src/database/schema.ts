import { mysqlTable, serial, text, timestamp } from 'drizzle-orm/mysql-core';

export const notes = mysqlTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
