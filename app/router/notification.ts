import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { notificationPreference, notificationLog } from "@/db/schema/notification";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

// ── Notification Preference handlers ──

export const upsertNotificationPreference = os.notification.upsert
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const { userId, organizationId } = context.user;
		const { channel, event, enabled, daysBeforeThreshold } = input;

		// Check if a preference already exists for this user/org/channel/event
		const [existing] = await db
			.select({ id: notificationPreference.id })
			.from(notificationPreference)
			.where(
				and(
					eq(notificationPreference.userId, userId),
					eq(notificationPreference.organizationId, organizationId),
					eq(notificationPreference.channel, channel),
					eq(notificationPreference.event, event),
				),
			)
			.limit(1);

		if (existing) {
			const [updated] = await db
				.update(notificationPreference)
				.set({
					enabled: enabled ?? true,
					daysBeforeThreshold: daysBeforeThreshold ?? 7,
				})
				.where(eq(notificationPreference.id, existing.id))
				.returning();

			return updated;
		}

		const [created] = await db
			.insert(notificationPreference)
			.values({
				userId,
				organizationId,
				channel,
				event,
				enabled: enabled ?? true,
				daysBeforeThreshold: daysBeforeThreshold ?? 7,
			})
			.returning();

		return created;
	});

export const bulkUpsertNotificationPreferences = os.notification.bulkUpsert
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const { userId, organizationId } = context.user;
		const { preferences } = input;

		const results: (typeof notificationPreference.$inferSelect)[] = [];

		// Process each preference — upsert by natural key
		for (const pref of preferences) {
			const [existing] = await db
				.select({ id: notificationPreference.id })
				.from(notificationPreference)
				.where(
					and(
						eq(notificationPreference.userId, userId),
						eq(notificationPreference.organizationId, organizationId),
						eq(notificationPreference.channel, pref.channel),
						eq(notificationPreference.event, pref.event),
					),
				)
				.limit(1);

			if (existing) {
				const [updated] = await db
					.update(notificationPreference)
					.set({
						enabled: pref.enabled ?? true,
						daysBeforeThreshold: pref.daysBeforeThreshold ?? 7,
					})
					.where(eq(notificationPreference.id, existing.id))
					.returning();

				results.push(updated);
			} else {
				const [created] = await db
					.insert(notificationPreference)
					.values({
						userId,
						organizationId,
						channel: pref.channel,
						event: pref.event,
						enabled: pref.enabled ?? true,
						daysBeforeThreshold: pref.daysBeforeThreshold ?? 7,
					})
					.returning();

				results.push(created);
			}
		}

		return { items: results };
	});

export const deleteNotificationPreference = os.notification.deletePreference
	.use(authMiddleware)
	.handler(async ({ input, errors, context }) => {
		const { userId } = context.user;

		const [existing] = await db
			.select({ id: notificationPreference.id, userId: notificationPreference.userId })
			.from(notificationPreference)
			.where(eq(notificationPreference.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "NotificationPreference",
					resourceId: input.id,
				},
				cause: "NOTIFICATION_PREFERENCE_NOT_FOUND",
			});
		}

		// Users can only delete their own preferences
		if (existing.userId !== userId) {
			throw errors.FORBIDDEN();
		}

		const [data] = await db
			.delete(notificationPreference)
			.where(eq(notificationPreference.id, input.id))
			.returning();

		return data;
	});

export const listNotificationPreferences = os.notification.listPreferences
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const { userId, organizationId } = context.user;
		const { channel, event } = input;

		const rows = await db
			.select()
			.from(notificationPreference)
			.where(
				and(
					eq(notificationPreference.userId, userId),
					eq(notificationPreference.organizationId, organizationId),
					channel ? eq(notificationPreference.channel, channel) : undefined,
					event ? eq(notificationPreference.event, event) : undefined,
				),
			)
			.orderBy(notificationPreference.event, notificationPreference.channel);

		return { items: rows };
	});

// ── Notification Log handlers ──

export const listNotificationLogs = os.notification.listLogs
	.use(authMiddleware)
	.handler(async ({ input, context }) => {
		const { userId } = context.user;
		const { cursor, limit, status, event, channel } = input;

		const rows = await db
			.select()
			.from(notificationLog)
			.where(
				and(
					eq(notificationLog.userId, userId),
					status ? eq(notificationLog.status, status) : undefined,
					event ? eq(notificationLog.event, event) : undefined,
					channel ? eq(notificationLog.channel, channel) : undefined,
					cursor ? gt(notificationLog.id, cursor) : undefined,
				),
			)
			.orderBy(desc(notificationLog.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

export const markNotificationRead = os.notification.markRead
	.use(authMiddleware)
	.handler(async ({ input, errors, context }) => {
		const { userId } = context.user;

		const [existing] = await db
			.select({
				id: notificationLog.id,
				userId: notificationLog.userId,
				status: notificationLog.status,
			})
			.from(notificationLog)
			.where(eq(notificationLog.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "NotificationLog",
					resourceId: input.id,
				},
				cause: "NOTIFICATION_NOT_FOUND",
			});
		}

		if (existing.userId !== userId) {
			throw errors.FORBIDDEN();
		}

		if (existing.status === "read") {
			// Already read — return as-is (idempotent)
			const [current] = await db
				.select()
				.from(notificationLog)
				.where(eq(notificationLog.id, input.id))
				.limit(1);
			return current;
		}

		const [data] = await db
			.update(notificationLog)
			.set({
				status: "read",
				readAt: new Date(),
			})
			.where(eq(notificationLog.id, input.id))
			.returning();

		return data;
	});

export const markAllNotificationsRead = os.notification.markAllRead
	.use(authMiddleware)
	.handler(async ({ context }) => {
		const { userId } = context.user;

		// Find all unread notification IDs for this user
		const unread = await db
			.select({ id: notificationLog.id })
			.from(notificationLog)
			.where(
				and(
					eq(notificationLog.userId, userId),
					// status is 'sent' or 'pending' — not yet 'read' or 'failed'
					inArray(notificationLog.status, ["sent", "pending"]),
				),
			);

		if (unread.length === 0) {
			return { updatedCount: 0 };
		}

		const ids = unread.map((r) => r.id);
		const now = new Date();

		await db
			.update(notificationLog)
			.set({ status: "read", readAt: now })
			.where(inArray(notificationLog.id, ids));

		return { updatedCount: ids.length };
	});
