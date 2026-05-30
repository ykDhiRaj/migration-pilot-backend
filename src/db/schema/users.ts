import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['LOCAL', 'GOOGLE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', { length: 255 }),

  email: varchar('email', { length: 255 }).notNull().unique(),

  password: varchar('password', { length: 255 }),

  authProvider: authProviderEnum('auth_provider').notNull(),

  providerId: varchar('provider_id', { length: 255 }),

  profileImage: text('profile_image'),

  isEmailVerified: boolean('is_email_verified').notNull().default(false),

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
