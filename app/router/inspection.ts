import { implement } from "@orpc/server";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { inspection } from "@/db/schema/inspection";
import { lease } from "@/db/schema/lease";
import { tenant } from "@/db/schema/tenant";
import { contract } from "../contract";
import {
	authMiddleware,
	type BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

/**
 * Returns the tenant.id for the authenticated user if role === 'tenant',
 * otherwise undefined.
 */
async function resolveTenantId(
	role: string,
	userId: string,
): Promise<number | undefined> {
	if (role !== "tenant") return undefined;
	const [self] = await db
		.select({ id: tenant.id })
		.from(tenant)
		.where(eq(tenant.userId, userId))
		.limit(1);
	return self?.id;
}

/**
 * Returns true if the tenant (looked up by userId) has an active lease on unitId.
 */
async function _tenantCanAccessUnit(
	userId: string,
	unitId: number,
): Promise<boolean> {
	const [self] = await db
		.select({ id: tenant.id })
		.from(tenant)
		.where(eq(tenant.userId, userId))
		.limit(1);

	if (!self) return false;

	const [activeLease] = await db
		.select({ id: lease.id })
		.from(lease)
		.where(
			and(
				eq(lease.unitId, unitId),
				eq(lease.tenantId, self.id),
				eq(lease.status, "active"),
			),
		)
		.limit(1);

	return activeLease !== undefined;
}

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
				message: "Inspection Not Found",
			});
		}

		if (existing.status !== "scheduled" && existing.status !== "rescheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_EDITABLE" },
				message: "Only scheduled or rescheduled inspections can be updated",
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
				message: "Inspection Not Found",
			});
		}

		if (existing.status !== "scheduled" && existing.status !== "rescheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_COMPLETABLE" },
				cause:
					"Only scheduled or rescheduled inspections can be marked as completed",
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
				message: "Only scheduled inspections can be skipped",
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

		if (existing.status !== "scheduled" && existing.status !== "rescheduled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "INSPECTION_NOT_DELETABLE" },
				message: "Only scheduled or rescheduled inspections can be deleted",
			});
		}

		const [data] = await db
			.update(inspection)
			.set({ status: "cancelled" })
			.where(eq(inspection.id, input.id))
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
	.handler(async ({ input, errors, context }) => {
		const { unitId, cursor, limit, status } = input;
		const { role, userId } = context.user;

		const tenantId = await resolveTenantId(role, userId);
		let tenantUnitIds: number[] | undefined;
		if (role === "tenant") {
			if (tenantId === undefined) {
				throw errors.FORBIDDEN();
			}

			const leaseRows = await db
				.select({ unitId: lease.unitId })
				.from(lease)
				.where(and(eq(lease.tenantId, tenantId), eq(lease.status, "active")));
			tenantUnitIds = leaseRows.map((row) => row.unitId);
			if (tenantUnitIds.length === 0) {
				return {
					items: [],
					nextCursor: null,
				};
			}
		}

		const rows = await db
			.select()
			.from(inspection)
			.where(
				and(
					unitId ? eq(inspection.unitId, unitId) : undefined,
					status ? eq(inspection.status, status) : undefined,
					cursor ? gt(inspection.id, cursor) : undefined,
					role === "tenant" && tenantUnitIds
						? inArray(inspection.unitId, tenantUnitIds)
						: undefined,
				),
			)
			.orderBy(asc(inspection.status), asc(inspection.scheduledDate))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
