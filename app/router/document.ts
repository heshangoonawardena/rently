import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import {
	unitDocument,
	tenantDocument,
	leaseDocument,
} from "@/db/schema/document";
import { and, desc, eq, gt } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { lease } from "@/db/schema/lease";
import { tenant } from "@/db/schema/tenant";
import { unit } from "@/db/schema/unit";

const os = implement(contract).$context<BaseContext>();

// ── Unit Document handlers ──

export const createUnitDocument = os.document.createUnit
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["create"] }))
	.handler(async ({ input }) => {
		const { unitId, ...rest } = input;

		const [data] = await db
			.insert(unitDocument)
			.values({ ...rest, unitId })
			.returning();

		return data;
	});

export const updateUnitDocument = os.document.updateUnit
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: unitDocument.id })
			.from(unitDocument)
			.where(eq(unitDocument.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "UnitDocument",
					resourceId: id,
				},
				cause: "UNIT_DOCUMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(unitDocument)
			.set(updates)
			.where(eq(unitDocument.id, id))
			.returning();

		return data;
	});

export const supersededUnitDocument = os.document.supersedeUnit
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["update"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({
				id: unitDocument.id,
				status: unitDocument.status,
			})
			.from(unitDocument)
			.where(eq(unitDocument.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "UnitDocument",
					resourceId: input.id,
				},
				cause: "UNIT_DOCUMENT_NOT_FOUND",
			});
		}

		if (existing.status !== "active") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "DOCUMENT_NOT_ACTIVE" },
				cause: "Only active documents can be marked as superseded",
			});
		}

		const [data] = await db
			.update(unitDocument)
			.set({ status: "superseded" })
			.where(eq(unitDocument.id, input.id))
			.returning();

		return data;
	});

export const deleteUnitDocument = os.document.deleteUnit
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({ id: unitDocument.id })
			.from(unitDocument)
			.where(eq(unitDocument.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "UnitDocument",
					resourceId: input.id,
				},
				cause: "UNIT_DOCUMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(unitDocument)
			.set({ status: "cancelled" })
			.where(eq(unitDocument.id, input.id))
			.returning();

		return data;
	});

export const getUnitDocument = os.document.getUnit
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, unitId } = input;
		const { role, userId } = context.user;

		// Tenants can only read documents for their own leases
		if (role === "tenant") {
			const [self] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(eq(tenant.userId, userId))
				.limit(1);

			if (!self) throw errors.FORBIDDEN();

			const [parentUnit] = await db
				.select({ id: unit.id })
				.from(unit)
				.where(and(eq(unit.id, unitId), eq(unit.id, self.id)))
				.limit(1);

			if (!parentUnit) throw errors.FORBIDDEN();
		}

		const [data] = await db
			.select()
			.from(unitDocument)
			.where(and(eq(unitDocument.id, id), eq(unitDocument.unitId, unitId)))
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: { resourceType: "UnitDocument", resourceId: id },
				cause: "UNIT_DOCUMENT_NOT_FOUND",
			});
		}

		return data;
	});

export const listUnitDocument = os.document.listUnit
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input }) => {
		const { unitId, cursor, limit, status } = input;

		const rows = await db
			.select()
			.from(unitDocument)
			.where(
				and(
					eq(unitDocument.unitId, unitId),
					status ? eq(unitDocument.status, status) : undefined,
					cursor ? gt(unitDocument.id, cursor) : undefined,
				),
			)
			.orderBy(desc(unitDocument.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Tenant Document handlers ──

export const createTenantDocument = os.document.createTenant
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["create"] }))
	.handler(async ({ input }) => {
		const { tenantId, ...rest } = input;

		const [data] = await db
			.insert(tenantDocument)
			.values({ ...rest, tenantId })
			.returning();

		return data;
	});

export const updateTenantDocument = os.document.updateTenant
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: tenantDocument.id })
			.from(tenantDocument)
			.where(eq(tenantDocument.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "TenantDocument",
					resourceId: id,
				},
				cause: "TENANT_DOCUMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(tenantDocument)
			.set(updates)
			.where(eq(tenantDocument.id, id))
			.returning();

		return data;
	});

export const deleteTenantDocument = os.document.deleteTenant
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({ id: tenantDocument.id })
			.from(tenantDocument)
			.where(eq(tenantDocument.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "TenantDocument",
					resourceId: input.id,
				},
				cause: "TENANT_DOCUMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(tenantDocument)
			.set({ status: "cancelled" })
			.where(eq(tenantDocument.id, input.id))
			.returning();

		return data;
	});

export const getTenantDocument = os.document.getTenant
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, tenantId } = input;
		const { role, userId } = context.user;

		// Tenants can only read documents for their own tenant
		if (role === "tenant") {
			const [self] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(eq(tenant.userId, userId))
				.limit(1);

			if (!self) throw errors.FORBIDDEN();

			const [parentTenant] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(and(eq(tenant.id, tenantId), eq(tenant.id, self.id)))
				.limit(1);

			if (!parentTenant) throw errors.FORBIDDEN();
		}

		const [data] = await db
			.select()
			.from(tenantDocument)
			.where(
				and(eq(tenantDocument.id, id), eq(tenantDocument.tenantId, tenantId)),
			)
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: { resourceType: "TenantDocument", resourceId: id },
				cause: "TENANT_DOCUMENT_NOT_FOUND",
			});
		}

		return data;
	});

export const listTenantDocument = os.document.listTenant
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input }) => {
		const { tenantId, cursor, limit, status, tenantOccupantId } = input;

		const rows = await db
			.select()
			.from(tenantDocument)
			.where(
				and(
					eq(tenantDocument.tenantId, tenantId),
					status ? eq(tenantDocument.status, status) : undefined,
					tenantOccupantId
						? eq(tenantDocument.tenantOccupantId, tenantOccupantId)
						: undefined,
					cursor ? gt(tenantDocument.id, cursor) : undefined,
				),
			)
			.orderBy(desc(tenantDocument.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Lease Document handlers ──

export const createLeaseDocument = os.document.createLease
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["create"] }))
	.handler(async ({ input, errors }) => {
		const { leaseId, ...rest } = input;

		// Verify the lease exists before attaching a document
		const [parentLease] = await db
			.select({ id: lease.id })
			.from(lease)
			.where(eq(lease.id, leaseId))
			.limit(1);

		if (!parentLease) {
			throw errors.NOT_FOUND({
				data: { resourceType: "Lease", resourceId: leaseId },
				cause: "LEASE_NOT_FOUND",
			});
		}

		const [data] = await db
			.insert(leaseDocument)
			.values({ ...rest, leaseId })
			.returning();

		return data;
	});

export const updateLeaseDocument = os.document.updateLease
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, leaseId, ...updates } = input;
		const { role, userId } = context.user;

		// Tenants cannot update documents
		if (role === "tenant") throw errors.FORBIDDEN();

		const [existing] = await db
			.select({ id: leaseDocument.id, status: leaseDocument.status })
			.from(leaseDocument)
			.where(and(eq(leaseDocument.id, id), eq(leaseDocument.leaseId, leaseId)))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: { resourceType: "LeaseDocument", resourceId: id },
				cause: "LEASE_DOCUMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(leaseDocument)
			.set(updates)
			.where(eq(leaseDocument.id, id))
			.returning();

		return data;
	});

export const supersededLeaseDocument = os.document.supersedeLease
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, leaseId } = input;
		const { role } = context.user;

		if (role === "tenant") throw errors.FORBIDDEN();

		const [existing] = await db
			.select({ id: leaseDocument.id, status: leaseDocument.status })
			.from(leaseDocument)
			.where(and(eq(leaseDocument.id, id), eq(leaseDocument.leaseId, leaseId)))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: { resourceType: "LeaseDocument", resourceId: id },
				cause: "LEASE_DOCUMENT_NOT_FOUND",
			});
		}

		if (existing.status !== "active") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "DOCUMENT_NOT_ACTIVE" },
				cause: "Only active documents can be marked as superseded",
			});
		}

		const [data] = await db
			.update(leaseDocument)
			.set({ status: "superseded" })
			.where(eq(leaseDocument.id, id))
			.returning();

		return data;
	});

export const deleteLeaseDocument = os.document.deleteLease
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["delete"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, leaseId } = input;
		const { role } = context.user;

		if (role === "tenant") throw errors.FORBIDDEN();

		const [existing] = await db
			.select({ id: leaseDocument.id })
			.from(leaseDocument)
			.where(and(eq(leaseDocument.id, id), eq(leaseDocument.leaseId, leaseId)))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: { resourceType: "LeaseDocument", resourceId: id },
				cause: "LEASE_DOCUMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(leaseDocument)
			.set({ status: "cancelled" })
			.where(eq(leaseDocument.id, id))
			.returning();

		return data;
	});

export const getLeaseDocument = os.document.getLease
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, leaseId } = input;
		const { role, userId } = context.user;

		// Tenants can only read documents for their own leases
		if (role === "tenant") {
			const [self] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(eq(tenant.userId, userId))
				.limit(1);

			if (!self) throw errors.FORBIDDEN();

			const [parentLease] = await db
				.select({ id: lease.id })
				.from(lease)
				.where(and(eq(lease.id, leaseId), eq(lease.tenantId, self.id)))
				.limit(1);

			if (!parentLease) throw errors.FORBIDDEN();
		}

		const [data] = await db
			.select()
			.from(leaseDocument)
			.where(and(eq(leaseDocument.id, id), eq(leaseDocument.leaseId, leaseId)))
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: { resourceType: "LeaseDocument", resourceId: id },
				cause: "LEASE_DOCUMENT_NOT_FOUND",
			});
		}

		return data;
	});

export const listLeaseDocument = os.document.listLease
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { leaseId, cursor, limit, status } = input;
		const { role, userId } = context.user;

		// Tenants can only list documents for their own leases
		if (role === "tenant") {
			const [self] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(eq(tenant.userId, userId))
				.limit(1);

			if (!self) throw errors.FORBIDDEN();

			const [parentLease] = await db
				.select({ id: lease.id })
				.from(lease)
				.where(and(eq(lease.id, leaseId), eq(lease.tenantId, self.id)))
				.limit(1);

			if (!parentLease) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select()
			.from(leaseDocument)
			.where(
				and(
					eq(leaseDocument.leaseId, leaseId),
					status ? eq(leaseDocument.status, status) : undefined,
					cursor ? gt(leaseDocument.id, cursor) : undefined,
				),
			)
			.orderBy(desc(leaseDocument.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
