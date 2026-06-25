import { oc } from "@orpc/contract";
import z from "zod";
import {
	bulkUpsertNotificationPreferences,
	deleteNotificationPreference,
	listNotificationLogInput,
	listNotificationLogOutput,
	listNotificationPreferenceInput,
	listNotificationPreferenceOutput,
	markAllNotificationsRead,
	markNotificationRead,
	notificationLogOutput,
	notificationPreferenceOutput,
	upsertNotificationPreference,
} from "../schemas/notification.schema";

export const base = oc.errors({
	UNAUTHORIZED: {
		status: 401,
		message: "Authentication required",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have permission to perform this action",
	},
	NOT_FOUND: {
		status: 404,
		message: "Resource not found",
		data: z.object({
			resourceType: z.string(),
			resourceId: z.number(),
		}),
	},
	DOMAIN_RULE_VIOLATION: {
		status: 422,
		message: "Business rule violation",
		data: z.object({
			rule: z.string(),
		}),
	},
});

// ── Notification Preference contracts ──

export const upsertNotificationPreferenceContract = base
	.route({
		method: "PUT",
		path: "/notifications/preferences/{channel}/{event}",
		successStatus: 200,
		summary: "Upsert a notification preference",
		description:
			"Creates or updates a single notification preference for the authenticated user. " +
			"The channel + event pair acts as the natural key. Use this to enable/disable a " +
			"specific channel for a specific event, or to adjust the daysBeforeThreshold.",
		tags: ["Notification Preferences"],
	})
	.input(upsertNotificationPreference)
	.output(notificationPreferenceOutput);

export const bulkUpsertNotificationPreferencesContract = base
	.route({
		method: "PUT",
		path: "/notifications/preferences",
		successStatus: 200,
		summary: "Bulk upsert notification preferences",
		description:
			"Upserts multiple preferences in a single request. Useful for onboarding flows " +
			"where a user configures all their notification settings at once. " +
			"Accepts up to 50 preferences per request.",
		tags: ["Notification Preferences"],
	})
	.input(bulkUpsertNotificationPreferences)
	.output(listNotificationPreferenceOutput);

export const deleteNotificationPreferenceContract = base
	.route({
		method: "DELETE",
		path: "/notifications/preferences/{id}",
		summary: "Delete a notification preference",
		description:
			"Removes a notification preference row. The system will fall back to default " +
			"behaviour (no notification sent) for that channel/event combination.",
		tags: ["Notification Preferences"],
	})
	.input(deleteNotificationPreference)
	.output(notificationPreferenceOutput);

export const listNotificationPreferencesContract = base
	.route({
		method: "GET",
		path: "/notifications/preferences",
		summary: "List notification preferences",
		description:
			"Returns all notification preferences for the authenticated user in the active " +
			"organization. Optionally filter by channel or event type.",
		tags: ["Notification Preferences"],
	})
	.input(listNotificationPreferenceInput)
	.output(listNotificationPreferenceOutput);

// ── Notification Log contracts ──

export const listNotificationLogsContract = base
	.route({
		method: "GET",
		path: "/notifications",
		summary: "List notification history",
		description:
			"Returns cursor-paginated notification log entries for the authenticated user. " +
			"Filter by status to fetch only unread notifications, or by event type to see " +
			"e.g. all rent-due alerts.",
		tags: ["Notification Log"],
	})
	.input(listNotificationLogInput)
	.output(listNotificationLogOutput);

export const markNotificationReadContract = base
	.route({
		method: "POST",
		path: "/notifications/{id}/read",
		successStatus: 200,
		summary: "Mark a notification as read",
		description:
			"Sets a single notification log entry to 'read' status and records readAt timestamp.",
		tags: ["Notification Log"],
	})
	.input(markNotificationRead)
	.output(notificationLogOutput);

export const markAllNotificationsReadContract = base
	.route({
		method: "POST",
		path: "/notifications/read-all",
		successStatus: 200,
		summary: "Mark all notifications as read",
		description:
			"Marks every unread notification for the authenticated user as read. " +
			"Useful for a 'clear all' button in the notification centre.",
		tags: ["Notification Log"],
	})
	.input(markAllNotificationsRead)
	.output(
		z.object({
			updatedCount: z.number().int().nonnegative(),
		}),
	);
