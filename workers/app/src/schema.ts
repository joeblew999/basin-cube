// The bookings table. migrations/0001_bookings.sql creates it in D1.
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey(),
  orgId: text('org_id').notNull(),
  coach: text('coach').notNull(),
  amount: real('amount').notNull(),
  bookedAt: integer('booked_at', { mode: 'timestamp' }).notNull(),
})

export const schema = { bookings }
