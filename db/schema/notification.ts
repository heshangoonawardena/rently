import {
	pgTable,
	text,
	timestamp,
	index,
	serial,
	integer,
	boolean,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
	notificationChannelEnum,
	notificationEventEnum,
	notificationStatusEnum,
} from "./enums";
import z from "zod";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";

export const notificationPreference = pgTable(
	"notification_preference",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		organizationId: text("organization_id").notNull(),
		channel: notificationChannelEnum("channel").notNull(),
		event: notificationEventEnum("event").notNull(),
		daysBeforeThreshold: integer("days_before_threshold").default(7),
		enabled: boolean("enabled").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("notification_preference_userId_idx").on(table.userId),
		index("notification_preference_channel_idx").on(table.channel),
		index("notification_preference_organizationId_idx").on(
			table.organizationId,
		),
	],
);

export const notificationLog = pgTable(
	"notification_log",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		organizationId: text("organization_id").notNull(),
		event: notificationEventEnum("event").notNull(),
		channel: notificationChannelEnum("channel").notNull(),
		status: notificationStatusEnum("status").default("pending").notNull(),
		payload: text("payload"), // JSON stringified context
		sentAt: timestamp("sent_at"),
		readAt: timestamp("read_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("notification_log_userId_idx").on(table.userId),
		index("notification_log_channel_idx").on(table.channel),
		index("notification_log_status_idx").on(table.status),
	],
);

export const selectNotificationPreferenceSchema = createSelectSchema(notificationPreference);
export type NotificationPreference = z.infer<typeof selectNotificationPreferenceSchema>;

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreference);
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

export const updateNotificationPreferenceSchema = createUpdateSchema(notificationPreference);
export type UpdateNotificationPreference = z.infer<typeof updateNotificationPreferenceSchema>;

export const selectNotificationLogSchema = createSelectSchema(notificationLog);
export type NotificationLog = z.infer<typeof selectNotificationLogSchema>;

export const insertNotificationLogSchema = createInsertSchema(notificationLog);
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

export const updateNotificationLogSchema = createUpdateSchema(notificationLog);
export type UpdateNotificationLog = z.infer<typeof updateNotificationLogSchema>;
