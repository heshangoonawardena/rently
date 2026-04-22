import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { inspection } from "@/db/schema/inspection";
import { and, desc, eq, gt } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

export const createInspection = os.inspection.create
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["create"] }))
	.handler(async ({ input, context }) => {
		const { unitId, ...rest } = input;
		const { userId } = context.user;

		const [data] = await db
			.insert(inspection)
			.values({
				...rest,
				unitId,
				userId,
			})
			.returning();

		return data;
	});

export const updateInspection = os.inspection.update
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({
				id: inspection.id,
				status: inspection.status,
			})
			.from(inspection)
			.where(eq(inspection.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Inspection",
					resourceId: id,
				},
				cause: "INSPECTION_NOT_FOUND",
			});
		}

		if (existing.status !== "scheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_EDITABLE" },
				cause: "Only scheduled inspections can be updated",
			});
		}

		const [data] = await db
			.update(inspection)
			.set(updates)
			.where(eq(inspection.id, id))
			.returning();

		return data;
	});

export const completeInspection = os.inspection.complete
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, completedDate, description } = input;

		const [existing] = await db
			.select({
				id: inspection.id,
				status: inspection.status,
			})
			.from(inspection)
			.where(eq(inspection.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Inspection",
					resourceId: id,
				},
				cause: "INSPECTION_NOT_FOUND",
			});
		}

		if (existing.status !== "scheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_COMPLETABLE" },
				cause: "Only scheduled inspections can be marked as completed",
			});
		}

		const [data] = await db
			.update(inspection)
			.set({
				status: "completed",
				completedDate,
				...(description ? { description } : {}),
			})
			.where(eq(inspection.id, id))
			.returning();

		return data;
	});

export const skipInspection = os.inspection.skip
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, description } = input;

		const [existing] = await db
			.select({
				id: inspection.id,
				status: inspection.status,
			})
			.from(inspection)
			.where(eq(inspection.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Inspection",
					resourceId: id,
				},
				cause: "INSPECTION_NOT_FOUND",
			});
		}

		if (existing.status !== "scheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_SKIPPABLE" },
				cause: "Only scheduled inspections can be skipped",
			});
		}

		const [data] = await db
			.update(inspection)
			.set({
				status: "skipped",
				...(description ? { description } : {}),
			})
			.where(eq(inspection.id, id))
			.returning();

		return data;
	});

export const deleteInspection = os.inspection.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({
				id: inspection.id,
				status: inspection.status,
			})
			.from(inspection)
			.where(eq(inspection.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Inspection",
					resourceId: input.id,
				},
				cause: "INSPECTION_NOT_FOUND",
			});
		}

		if (existing.status !== "scheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_DELETABLE" },
				cause: "Only scheduled inspections can be deleted",
			});
		}

		const [data] = await db
			.update(inspection)
			.set({ status: "cancelled" })
			.returning();

		return data;
	});

export const getInspection = os.inspection.get
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["read"] }))
	.handler(async ({ input, errors }) => {
		const [data] = await db
			.select()
			.from(inspection)
			.where(
				and(eq(inspection.id, input.id), eq(inspection.unitId, input.unitId)),
			)
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Inspection",
					resourceId: input.id,
				},
				cause: "INSPECTION_NOT_FOUND",
			});
		}

		return data;
	});

export const listInspection = os.inspection.list
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["read"] }))
	.handler(async ({ input }) => {
		const { unitId, cursor, limit, status } = input;

		const rows = await db
			.select()
			.from(inspection)
			.where(
				and(
					eq(inspection.unitId, unitId),
					status ? eq(inspection.status, status) : undefined,
					cursor ? gt(inspection.id, cursor) : undefined,
				),
			)
			.orderBy(desc(inspection.scheduledDate))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
