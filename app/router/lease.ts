import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { and, asc, desc, eq, gt, or } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { lease, leaseRent } from "@/db/schema/lease";
import { unit } from "@/db/schema/unit";

const os = implement(contract).$context<BaseContext>();

// ── Lease handlers ──

export const createLease = os.lease.create
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["create"] }))
	.handler(async ({ input, errors, context }) => {
		const { rentAmount, ...leaseData } = input;
		const { organizationId } = context.user;

		// Check the unit exists and belongs to this org
		const [targetUnit] = await db
			.select({ id: unit.id, status: unit.status })
			.from(unit)
			.where(
				and(
					eq(unit.id, leaseData.unitId),
					eq(unit.organizationId, organizationId),
				),
			)
			.limit(1);

		if (!targetUnit) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Unit",
					resourceId: leaseData.unitId,
				},
				cause: "UNIT_NOT_FOUND",
			});
		}

		if (targetUnit.status !== "available") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: {
					rule: "UNIT_NOT_AVAILABLE",
				},
				cause: `Unit is currently '${targetUnit.status}' — only 'available' units can be leased`,
			});
		}

		// Insert lease + seed first rent row + update unit status atomically
		const [newLease] = await db.insert(lease).values(leaseData).returning();

		await db.insert(leaseRent).values({
			leaseId: newLease.id,
			rentAmount,
			effectiveDate: leaseData.startDate,
		});

		await db
			.update(unit)
			.set({ status: "occupied" })
			.where(eq(unit.id, leaseData.unitId));

		return newLease;
	});

export const updateLease = os.lease.update
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: lease.id })
			.from(lease)
			.where(eq(lease.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: id,
				},
				cause: "LEASE_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(lease)
			.set(updates)
			.where(eq(lease.id, id))
			.returning();

		return data;
	});

export const deleteLease = os.lease.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["delete"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, endDate } = input;

		const [existing] = await db
			.select({
				id: lease.id,
				unitId: lease.unitId,
				status: lease.status,
			})
			.from(lease)
			.where(eq(lease.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: id,
				},
				cause: "LEASE_NOT_FOUND",
			});
		}

		if (existing.status !== "active") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE" },
				cause: "Only active leases can be terminated",
			});
		}

		const [data] = await db
			.update(lease)
			.set({
				status: "terminated",
				endDate,
			})
			.where(eq(lease.id, id))
			.returning();

		// Free up the unit
		await db
			.update(unit)
			.set({ status: "available" })
			.where(eq(unit.id, existing.unitId));

		return data;
	});

export const renewLease = os.lease.renew
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, newEndDate, rentAmount, effectiveDate } = input;

		const [existing] = await db
			.select({
				id: lease.id,
				status: lease.status,
				unitId: lease.unitId,
			})
			.from(lease)
			.where(eq(lease.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: id,
				},
				cause: "LEASE_NOT_FOUND",
			});
		}

		if (existing.status !== "active" && existing.status !== "extended") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_RENEWABLE" },
				cause: "Only active or previously extended leases can be renewed",
			});
		}

		const [updated] = await db
			.update(lease)
			.set({
				status: "extended",
				endDate: newEndDate,
			})
			.where(eq(lease.id, id))
			.returning();

		// Optionally seed a new rent revision
		if (rentAmount) {
			await db.insert(leaseRent).values({
				leaseId: id,
				rentAmount,
				effectiveDate: effectiveDate ?? newEndDate,
			});
		}

		return updated;
	});

export const getLease = os.lease.get
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input, errors }) => {
		const [data] = await db
			.select()
			.from(lease)
			.where(eq(lease.id, input.id))
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: input.id,
				},
				cause: "LEASE_NOT_FOUND",
			});
		}

		return data;
	});

export const listLease = os.lease.list
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input }) => {
		const { cursor, limit, status, unitId, tenantId } = input;

		const rows = await db
			.select()
			.from(lease)
			.where(
				and(
					status ? eq(lease.status, status) : undefined,
					unitId ? eq(lease.unitId, unitId) : undefined,
					tenantId ? eq(lease.tenantId, tenantId) : undefined,
					cursor ? gt(lease.id, cursor) : undefined,
				),
			)
			.orderBy(desc(lease.updatedAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Lease Rent handlers ──

export const createLeaseRent = os.lease.createRent
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["create"] }))
	.handler(async ({ input, errors }) => {
		const { leaseId, ...rentData } = input;

		const [parentLease] = await db
			.select({ id: lease.id, status: lease.status })
			.from(lease)
			.where(eq(lease.id, leaseId))
			.limit(1);

		if (!parentLease) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: leaseId,
				},
				cause: "LEASE_NOT_FOUND",
			});
		}

		if (parentLease.status !== "active") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE" },
				cause: "Rent revisions can only be added to active leases",
			});
		}

		const [data] = await db
			.insert(leaseRent)
			.values({ ...rentData, leaseId })
			.returning();

		return data;
	});

export const updateLeaseRent = os.lease.updateRent
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: leaseRent.id })
			.from(leaseRent)
			.where(eq(leaseRent.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "LeaseRent",
					resourceId: id,
				},
				cause: "LEASE_RENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(leaseRent)
			.set(updates)
			.where(eq(leaseRent.id, id))
			.returning();

		return data;
	});

export const deleteLeaseRent = os.lease.deleteRent
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({ id: leaseRent.id })
			.from(leaseRent)
			.where(eq(leaseRent.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: { resourceType: "LeaseRent", resourceId: input.id },
				cause: "LEASE_RENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(leaseRent)
			.set({ status: "inactive" })
			.where(eq(leaseRent.id, input.id))
			.returning();

		return data;
	});

export const listLeaseRent = os.lease.listRents
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input }) => {
		const { leaseId, cursor, limit } = input;

		const rows = await db
			.select()
			.from(leaseRent)
			.where(
				and(
					eq(leaseRent.leaseId, leaseId),
					cursor ? gt(leaseRent.id, cursor) : undefined,
				),
			)
			.orderBy(asc(leaseRent.effectiveDate))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
