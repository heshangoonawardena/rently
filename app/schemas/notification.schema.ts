import z from "zod";
import {
	notificationChannelEnum,
	notificationEventEnum,
	notificationStatusEnum,
} from "@/db/schema/enums";
import {
	insertNotificationPreferenceSchema,
	insertNotificationLogSchema,
	selectNotificationPreferenceSchema,
	selectNotificationLogSchema,
	updateNotificationPreferenceSchema,
} from "@/db/schema/notification";

// ── Output schemas ──

export const NotificationPreferenceOutput = selectNotificationPreferenceSchema;

export const ListNotificationPreferenceOutput = z.object({
	items: z.array(NotificationPreferenceOutput),
});

export const NotificationLogOutput = selectNotificationLogSchema;

export const ListNotificationLogOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(NotificationLogOutput),
});

// ── Input schemas ──

export const UpsertNotificationPreference = insertNotificationPreferenceSchema
	.omit({
		id: true,
		userId: true,
		organizationId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		// channel + event together are the natural key; upsert merges on them
	});

export const BulkUpsertNotificationPreferences = z.object({
	preferences: z.array(UpsertNotificationPreference).min(1).max(50),
});

export const DeleteNotificationPreference = z.object({
	id: z.number().int().positive(),
});

export const ListNotificationPreferenceInput = z.object({
	channel: z.enum(notificationChannelEnum.enumValues).optional(),
	event: z.enum(notificationEventEnum.enumValues).optional(),
});

// ── Notification Log input schemas ──

export const MarkNotificationRead = z.object({
	id: z.number().int().positive(),
});

export const MarkAllNotificationsRead = z.object({
	// empty — scoped to the current user automatically
});

export const ListNotificationLogInput = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(notificationStatusEnum.enumValues).optional(),
	event: z.enum(notificationEventEnum.enumValues).optional(),
	channel: z.enum(notificationChannelEnum.enumValues).optional(),
});
