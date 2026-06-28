import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

import { users } from './users';

export const databaseTypeEnum = pgEnum(
  'database_type',
  ['MYSQL', 'POSTGRESQL'],
);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  name: varchar('name', {
    length: 255,
  }).notNull(),

  description: text('description'),

  databaseType: databaseTypeEnum(
    'database_type',
  ).notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;