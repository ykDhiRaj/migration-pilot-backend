import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),

  email: varchar('email', { length: 255 })
    .notNull()
    .unique(),

  otp: varchar('otp', { length: 10 })
    .notNull(),

  expiresAt: timestamp('expires_at', {
    withTimezone: true,
  })
    .notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export type EmailVerification = typeof emailVerifications.$inferSelect;

export type NewEmailVerification = typeof emailVerifications.$inferInsert;