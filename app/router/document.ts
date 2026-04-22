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
			.returning();

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
			.returning();

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
