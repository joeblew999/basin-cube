// The Bookings cube. Every query is limited to the caller's organisation.
import { eq } from 'drizzle-orm'
import { defineCube } from 'drizzle-cube/server'
import { bookings } from './schema'

export const bookingsCube = defineCube('Bookings', {
  sql: (ctx) => ({ from: bookings, where: eq(bookings.orgId, ctx.securityContext.orgId as string) }),
  measures: {
    count: { name: 'count', type: 'count', sql: bookings.id },
    revenue: { name: 'revenue', type: 'sum', sql: bookings.amount },
  },
  dimensions: {
    id: { name: 'id', type: 'number', sql: bookings.id, primaryKey: true },
    coach: { name: 'coach', type: 'string', sql: bookings.coach },
    bookedAt: { name: 'bookedAt', type: 'time', sql: bookings.bookedAt },
  },
})
