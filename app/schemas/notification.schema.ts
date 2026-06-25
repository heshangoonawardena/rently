import z from "zod";
import {
	notificationChannelEnum,
	notificationEventEnum,
	notificationStatusEnum,
} from "@/db/schema/enums";

// ── Output schemas ──

export const notificationPreferenceSchema = z.object({
	id: z.number().min(1, "Id is required"),
	userId: z.string().nullish(),
	channel: z.enum(notificationChannelEnum.enumValues),
	event: z.enum(notificationEventEnum.enumValues),
	daysBeforeThreshold: z.number().nullable(),
	enabled: z.boolean().default(true),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const notificationLogSchema = z.object({
	userId: z.string().min(1, "User id is required"),
	event: z.enum(notificationEventEnum.enumValues),
	channel: z.enum(notificationChannelEnum.enumValues),
	status: z.enum(notificationStatusEnum.enumValues),
	payload: z.string().nullable(),
	sentAt: z.date().nullable(),
	readAt: z.date().nullable(),
});

export const notificationPreferenceOutput = notificationPreferenceSchema;

export const listNotificationPreferenceOutput = z.object({
	items: z.array(notificationPreferenceOutput),
});

export const notificationLogOutput = notificationLogSchema;

export const listNotificationLogOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(notificationLogOutput),
});

// ── Input schemas ──

export const upsertNotificationPreference = notificationPreferenceSchema.extend(
	{
		// channel + event together are the natural key; upsert merges on them
	},
);

export const bulkUpsertNotificationPreferences = z.object({
	preferences: z.array(upsertNotificationPreference).min(1).max(50),
});

export const deleteNotificationPreference = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listNotificationPreferenceInput = z.object({
	channel: z.enum(notificationChannelEnum.enumValues).optional(),
	event: z.enum(notificationEventEnum.enumValues).optional(),
});

// ── Notification Log input schemas ──

export const markNotificationRead = z.object({
	id: z.number().min(1, "Id is required"),
});

export const markAllNotificationsRead = z.object({
	// empty — scoped to the current user automatically
});

export const listNotificationLogInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(notificationStatusEnum.enumValues).optional(),
	event: z.enum(notificationEventEnum.enumValues).optional(),
	channel: z.enum(notificationChannelEnum.enumValues).optional(),
});
