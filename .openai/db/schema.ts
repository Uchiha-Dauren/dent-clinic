import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const bookingRequests = sqliteTable(
  'booking_requests',
  {
    id: text('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    payloadHash: text('payload_hash').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    preferredDate: text('preferred_date').notNull(),
    preferredTime: text('preferred_time').notNull(),
    service: text('service'),
    doctor: text('doctor'),
    comment: text('comment').notNull().default(''),
    adminNote: text('admin_note').notNull().default(''),
    revision: integer('revision').notNull().default(1),
    consent: integer('consent', { mode: 'boolean' }).notNull(),
    consentVersion: text('consent_version').notNull(),
    lang: text('lang').notNull(),
    source: text('source').notNull().default('website'),
    status: text('status').notNull().default('pending'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('bookings_created_idx').on(table.createdAt),
    index('bookings_status_idx').on(table.status),
  ],
);
export const requestLimits = sqliteTable(
  'request_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('limits_expiry_idx').on(table.expiresAt)],
);
