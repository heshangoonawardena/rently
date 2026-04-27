import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { repairRequest, repairUpdate } from "@/db/schema/repair";
import { and, desc, eq, gt } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { lease } from "@/db/schema/lease";
import { tenant } from "@/db/schema/tenant";

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
 * Verify that a tenant has an active lease on a given unit.
 */
async function tenantHasLeaseOnUnit(
	tenantId: number,
	unitId: number,
): Promise<boolean> {
	const [row] = await db
		.select({ id: lease.id })
		.from(lease)
		.where(
			and(
				eq(lease.unitId, unitId),
				eq(lease.tenantId, tenantId),
				eq(lease.status, "active"),
			),
		)
		.limit(1);
	return row !== undefined;
}

// ── Repair Request handlers ──

export const createRepairRequest = os.repair.create
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["create"] }))
	.handler(async ({ input, context }) => {
		const { unitId, ...rest } = input;
		const { userId } = context.user;

		const [data] = await db
			.insert(repairRequest)
			.values({
				...rest,
				unitId,
				userId,
				status: "open",
			})
			.returning();

		return data;
	});

export const updateRepairRequest = os.repair.update
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({
				id: repairRequest.id,
				status: repairRequest.status,
			})
			.from(repairRequest)
			.where(eq(repairRequest.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "RepairRequest",
					resourceId: id,
				},
				cause: "REPAIR_REQUEST_NOT_FOUND",
			});
		}

		if (existing.status === "resolved" || existing.status === "cancelled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "REPAIR_REQUEST_ALREADY_RESOLVED" },
				cause: "Repair request is already resolved",
			});
		}

		const [data] = await db
			.update(repairRequest)
			.set(updates)
			.where(eq(repairRequest.id, id))
			.returning();

		return data;
	});

export const deleteRepairRequest = os.repair.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({
				id: repairRequest.id,
				status: repairRequest.status,
			})
			.from(repairRequest)
			.where(eq(repairRequest.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "RepairRequest",
					resourceId: input.id,
				},
				cause: "REPAIR_REQUEST_NOT_FOUND",
			});
		}

		if (existing.status === "resolved" || existing.status === "cancelled") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "REPAIR_REQUEST_ALREADY_RESOLVED" },
				cause: "Repair request is already resolved",
			});
		}

		const [data] = await db
			.update(repairRequest)
			.set({ status: "cancelled" })
			.where(eq(repairRequest.id, input.id))
			.returning();

		return data;
	});

export const getRepairRequest = os.repair.get
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { role, userId } = context.user;

		// Tenants may only read repair requests on their own unit
		const tenantId = await resolveTenantId(role, userId);
		if (role === "tenant") {
			if (tenantId === undefined) throw errors.FORBIDDEN();
			const allowed = await tenantHasLeaseOnUnit(tenantId, input.unitId);
			if (!allowed) throw errors.FORBIDDEN();
		}

		const [data] = await db
			.select()
			.from(repairRequest)
			.where(
				and(
					eq(repairRequest.id, input.id),
					eq(repairRequest.unitId, input.unitId),
				),
			)
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "RepairRequest",
					resourceId: input.id,
				},
				cause: "REPAIR_REQUEST_NOT_FOUND",
			});
		}

		return data;
	});

export const listRepairRequest = os.repair.list
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { unitId, cursor, limit, status, priority, repairType } = input;
		const { role, userId } = context.user;

		// Tenants may only list repairs on their own unit
		const tenantId = await resolveTenantId(role, userId);
		if (role === "tenant") {
			if (tenantId === undefined) throw errors.FORBIDDEN();
			const allowed = await tenantHasLeaseOnUnit(tenantId, unitId);
			if (!allowed) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select()
			.from(repairRequest)
			.where(
				and(
					eq(repairRequest.unitId, unitId),
					status ? eq(repairRequest.status, status) : undefined,
					priority ? eq(repairRequest.priority, priority) : undefined,
					repairType ? eq(repairRequest.repairType, repairType) : undefined,
					cursor ? gt(repairRequest.id, cursor) : undefined,
				),
			)
			.orderBy(desc(repairRequest.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Repair Update (event log) handlers ──

export const addRepairUpdate = os.repair.addUpdate
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { repairRequestId, newStatus, ...rest } = input;
		const { userId } = context.user;

		// Capture the current status as oldStatus
		const [current] = await db
			.select({
				id: repairRequest.id,
				status: repairRequest.status,
			})
			.from(repairRequest)
			.where(eq(repairRequest.id, repairRequestId))
			.limit(1);

		if (!current) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "RepairRequest",
					resourceId: repairRequestId,
				},
				cause: "REPAIR_REQUEST_NOT_FOUND",
			});
		}

		const oldStatus = current.status;

		// Insert the immutable update log entry
		const [updateEntry] = await db
			.insert(repairUpdate)
			.values({
				...rest,
				repairRequestId,
				userId,
				oldStatus,
				newStatus: newStatus ?? null,
			})
			.returning();

		// Advance the request status if a new status was provided
		if (newStatus && newStatus !== oldStatus) {
			await db
				.update(repairRequest)
				.set({ status: newStatus })
				.where(eq(repairRequest.id, repairRequestId));
		}

		return updateEntry;
	});

export const listRepairUpdates = os.repair.listUpdates
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { repairRequestId, cursor, limit } = input;
		const { role, userId } = context.user;

		// Tenants may only list updates for repairs on their own unit
		if (role === "tenant") {
			const tenantId = await resolveTenantId(role, userId);
			if (tenantId === undefined) throw errors.FORBIDDEN();

			const [parent] = await db
				.select({ unitId: repairRequest.unitId })
				.from(repairRequest)
				.where(eq(repairRequest.id, repairRequestId))
				.limit(1);

			if (!parent) {
				throw errors.NOT_FOUND({
					data: { resourceType: "RepairRequest", resourceId: repairRequestId },
					cause: "REPAIR_REQUEST_NOT_FOUND",
				});
			}

			const allowed = await tenantHasLeaseOnUnit(tenantId, parent.unitId);
			if (!allowed) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select()
			.from(repairUpdate)
			.where(
				and(
					eq(repairUpdate.repairRequestId, repairRequestId),
					cursor ? gt(repairUpdate.id, cursor) : undefined,
				),
			)
			.orderBy(desc(repairUpdate.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
