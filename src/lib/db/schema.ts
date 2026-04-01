import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "operator",
  "member",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
]);

export const planStatusEnum = pgEnum("plan_status", [
  "draft",
  "active",
  "inactive",
  "archived",
]);

export const planDurationTypeEnum = pgEnum("plan_duration_type", [
  "weekly",
  "monthly",
  "custom",
]);

export const memberPlanStatusEnum = pgEnum("member_plan_status", [
  "active",
  "pending_payment",
  "expired",
  "cancelled",
]);

export const spaceStatusEnum = pgEnum("space_status", [
  "active",
  "inactive",
  "maintenance",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled_by_user",
  "cancelled_by_admin",
  "completed",
  "no_show",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "skipped",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("member"),
  status: userStatusEnum("status").notNull().default("active"),
  ...timestamps,
}, (table) => ({
  emailIdx: uniqueIndex("profiles_email_unique").on(table.email),
}));

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: userStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  ...timestamps,
}, (table) => ({
  emailIdx: uniqueIndex("members_email_unique").on(table.email),
  profileIdx: uniqueIndex("members_profile_unique").on(table.profileId),
}));

export const spaces = pgTable("spaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  capacity: integer("capacity"),
  status: spaceStatusEnum("status").notNull().default("active"),
  hourlyQuotaCost: integer("hourly_quota_cost").notNull().default(1),
  minBookingHours: integer("min_booking_hours").notNull().default(1),
  maxBookingHours: integer("max_booking_hours").notNull().default(8),
  ...timestamps,
}, (table) => ({
  slugIdx: uniqueIndex("spaces_slug_unique").on(table.slug),
}));

export const spaceAvailabilityRules = pgTable("space_availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const spaceBlocks = pgTable("space_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  reason: text("reason"),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: planStatusEnum("status").notNull().default("draft"),
  durationType: planDurationTypeEnum("duration_type").notNull().default("monthly"),
  durationValue: integer("duration_value").notNull().default(1),
  quotaAmount: integer("quota_amount").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  cancellationPolicyHours: integer("cancellation_policy_hours")
    .notNull()
    .default(24),
  maxBookingsPerDay: integer("max_bookings_per_day"),
  maxBookingsPerWeek: integer("max_bookings_per_week"),
  ...timestamps,
});

export const memberPlans = pgTable("member_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  status: memberPlanStatusEnum("status").notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
  nextPaymentDueAt: timestamp("next_payment_due_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  quotaTotal: integer("quota_total").notNull(),
  quotaUsed: integer("quota_used").notNull().default(0),
  quotaRemaining: integer("quota_remaining").notNull(),
  lastRenewedAt: timestamp("last_renewed_at", {
    withTimezone: true,
    mode: "date",
  }),
  renewedManually: boolean("renewed_manually").notNull().default(false),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  updatedBy: uuid("updated_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  spaceId: uuid("space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "restrict" }),
  memberPlanId: uuid("member_plan_id").references(() => memberPlans.id, {
    onDelete: "set null",
  }),
  startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
  durationHours: integer("duration_hours").notNull(),
  hourlyQuotaCost: integer("hourly_quota_cost").notNull(),
  quotaConsumed: integer("quota_consumed").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
  cancelledBy: uuid("cancelled_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

export const bookingStatusHistory = pgTable("booking_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  oldStatus: bookingStatusEnum("old_status"),
  newStatus: bookingStatusEnum("new_status").notNull(),
  changedBy: uuid("changed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  changedAt: timestamp("changed_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  note: text("note"),
});

export const renewals = pgTable("renewals", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  memberPlanId: uuid("member_plan_id")
    .notNull()
    .references(() => memberPlans.id, { onDelete: "cascade" }),
  renewedBy: uuid("renewed_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  renewedAt: timestamp("renewed_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  oldEndDate: timestamp("old_end_date", { withTimezone: true, mode: "date" })
    .notNull(),
  newEndDate: timestamp("new_end_date", { withTimezone: true, mode: "date" })
    .notNull(),
  oldQuotaRemaining: integer("old_quota_remaining").notNull(),
  newQuotaTotal: integer("new_quota_total").notNull(),
  notes: text("notes"),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),
  valueJson: jsonb("value_json").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedBy: uuid("updated_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
}, (table) => ({
  keyIdx: uniqueIndex("system_settings_key_unique").on(table.key),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  actorRole: roleEnum("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: text("channel").notNull().default("email"),
    audience: text("audience").notNull(),
    eventType: text("event_type").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    recipientName: text("recipient_name"),
    subject: text("subject").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    scheduledFor: timestamp("scheduled_for", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dedupeKeyIdx: uniqueIndex("notification_deliveries_dedupe_key_unique").on(
      table.dedupeKey,
    ),
  }),
);

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  member: one(members, {
    fields: [profiles.id],
    references: [members.profileId],
  }),
  createdSpaceBlocks: many(spaceBlocks),
  createdMemberPlans: many(memberPlans, { relationName: "member_plan_created_by" }),
  updatedMemberPlans: many(memberPlans, { relationName: "member_plan_updated_by" }),
  createdBookings: many(bookings, { relationName: "booking_created_by" }),
  cancelledBookings: many(bookings, { relationName: "booking_cancelled_by" }),
  bookingStatusChanges: many(bookingStatusHistory),
  renewals: many(renewals),
  settingsUpdates: many(systemSettings),
  auditLogs: many(auditLogs),
}));

export const membersRelations = relations(members, ({ many, one }) => ({
  profile: one(profiles, {
    fields: [members.profileId],
    references: [profiles.id],
  }),
  memberPlans: many(memberPlans),
  bookings: many(bookings),
  renewals: many(renewals),
}));

export const spacesRelations = relations(spaces, ({ many }) => ({
  availabilityRules: many(spaceAvailabilityRules),
  blocks: many(spaceBlocks),
  bookings: many(bookings),
}));

export const spaceAvailabilityRulesRelations = relations(
  spaceAvailabilityRules,
  ({ one }) => ({
    space: one(spaces, {
      fields: [spaceAvailabilityRules.spaceId],
      references: [spaces.id],
    }),
  }),
);

export const spaceBlocksRelations = relations(spaceBlocks, ({ one }) => ({
  space: one(spaces, {
    fields: [spaceBlocks.spaceId],
    references: [spaces.id],
  }),
  creator: one(profiles, {
    fields: [spaceBlocks.createdBy],
    references: [profiles.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  memberPlans: many(memberPlans),
}));

export const memberPlansRelations = relations(memberPlans, ({ many, one }) => ({
  member: one(members, {
    fields: [memberPlans.memberId],
    references: [members.id],
  }),
  plan: one(plans, {
    fields: [memberPlans.planId],
    references: [plans.id],
  }),
  creator: one(profiles, {
    relationName: "member_plan_created_by",
    fields: [memberPlans.createdBy],
    references: [profiles.id],
  }),
  updater: one(profiles, {
    relationName: "member_plan_updated_by",
    fields: [memberPlans.updatedBy],
    references: [profiles.id],
  }),
  bookings: many(bookings),
  renewals: many(renewals),
}));

export const bookingsRelations = relations(bookings, ({ many, one }) => ({
  member: one(members, {
    fields: [bookings.memberId],
    references: [members.id],
  }),
  space: one(spaces, {
    fields: [bookings.spaceId],
    references: [spaces.id],
  }),
  memberPlan: one(memberPlans, {
    fields: [bookings.memberPlanId],
    references: [memberPlans.id],
  }),
  creator: one(profiles, {
    relationName: "booking_created_by",
    fields: [bookings.createdBy],
    references: [profiles.id],
  }),
  canceller: one(profiles, {
    relationName: "booking_cancelled_by",
    fields: [bookings.cancelledBy],
    references: [profiles.id],
  }),
  statusHistory: many(bookingStatusHistory),
}));

export const bookingStatusHistoryRelations = relations(
  bookingStatusHistory,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingStatusHistory.bookingId],
      references: [bookings.id],
    }),
    changedByProfile: one(profiles, {
      fields: [bookingStatusHistory.changedBy],
      references: [profiles.id],
    }),
  }),
);

export const renewalsRelations = relations(renewals, ({ one }) => ({
  member: one(members, {
    fields: [renewals.memberId],
    references: [members.id],
  }),
  memberPlan: one(memberPlans, {
    fields: [renewals.memberPlanId],
    references: [memberPlans.id],
  }),
  renewedByProfile: one(profiles, {
    fields: [renewals.renewedBy],
    references: [profiles.id],
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedByProfile: one(profiles, {
    fields: [systemSettings.updatedBy],
    references: [profiles.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(profiles, {
    fields: [auditLogs.actorId],
    references: [profiles.id],
  }),
}));

export const notificationDeliveriesRelations = relations(
  notificationDeliveries,
  () => ({}),
);
