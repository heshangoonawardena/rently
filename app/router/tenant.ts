import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { and, asc, desc, eq, gt, ilike, or } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { tenant, tenantOccupant } from "@/db/schema/tenant";
import { lease } from "@/db/schema/lease";

const os = implement(contract).$context<BaseContext>();

// ── Tenant handlers ──

export const createTenant = os.tenant.create
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["create"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;

		if (input.nickname) {
			const [nicknameConflict] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(
					and(
						eq(tenant.organizationId, organizationId),
						eq(tenant.nickname, input.nickname),
					),
				)
				.limit(1);

			if (nicknameConflict) {
				throw errors.CONFLICT({
					data: {
						field: "nickname",
						value: input.nickname,
					},
					message: "Tenant Nickname Already Exists",
				});
			}
		}

		const [nicConflict] = await db
			.select({ id: tenant.id })
			.from(tenant)
			.where(
				and(
					eq(tenant.organizationId, organizationId),
					eq(tenant.nic, input.nic),
				),
			)
			.limit(1);

		if (nicConflict) {
			throw errors.CONFLICT({
				data: {
					field: "nic",
					value: input.nic,
				},
				message: "Tenant Nic Already Exists",
			});
		}

		const [phoneConflict] = await db
			.select({ id: tenant.id })
			.from(tenant)
			.where(
				and(
					eq(tenant.organizationId, organizationId),
					eq(tenant.phoneNumber, input.phoneNumber),
				),
			)
			.limit(1);

		if (phoneConflict) {
			throw errors.CONFLICT({
				data: {
					field: "phoneNumber",
					value: input.phoneNumber,
				},
				message: "Tenant Phone Number Already Exists",
			});
		}

		const [data] = await db
			.insert(tenant)
			.values({
				...input,
				organizationId,
			})
			.returning();

		return data;
	});

export const updateTenant = os.tenant.update
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, ...updates } = input;
		const { organizationId } = context.user;

		const [existing] = await db
			.select({ id: tenant.id })
			.from(tenant)
			.where(and(eq(tenant.id, id), eq(tenant.organizationId, organizationId)))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Tenant",
					resourceId: id,
				},
				message: "Tenant Not Found",
			});
		}

		const [data] = await db
			.update(tenant)
			.set(updates)
			.where(eq(tenant.id, id))
			.returning();

		return data;
	});

export const deleteTenant = os.tenant.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["delete"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;

		const [existing] = await db
			.select({ id: tenant.id })
			.from(tenant)
			.where(
				and(eq(tenant.id, input.id), eq(tenant.organizationId, organizationId)),
			)
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Tenant",
					resourceId: input.id,
				},
				message: "Tenant Not Found",
			});
		}

		// Prevent deletion if active leases exist
		const [activeLease] = await db
			.select({ id: lease.id })
			.from(lease)
			.where(and(eq(lease.tenantId, input.id), eq(lease.status, "active")))
			.limit(1);

		if (activeLease) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "TENANT_HAS_ACTIVE_LEASE" },
				message: "Cannot delete a tenant with an active lease",
			});
		}

		const [data] = await db
			.update(tenant)
			.set({ status: "inactive" })
			.where(eq(tenant.id, input.id))
			.returning();

		return data;
	});

export const getTenant = os.tenant.get
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;

		const [data] = await db
			.select()
			.from(tenant)
			.where(
				and(eq(tenant.id, input.id), eq(tenant.organizationId, organizationId)),
			)
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Tenant",
					resourceId: input.id,
				},
				message: "Tenant Not Found",
			});
		}

		return data;
	});

export const listTenant = os.tenant.list
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["read"] }))
	.handler(async ({ input }) => {
		const { cursor, limit, search } = input;

		const rows = await db
			.select()
			.from(tenant)
			.where(
				and(
					search
						? or(
								ilike(tenant.firstName, `%${search}%`),
								ilike(tenant.nickname, `%${search}%`),
								ilike(tenant.nic, `%${search}%`),
								ilike(tenant.phoneNumber, `%${search}%`),
							)
						: undefined,
					cursor ? gt(tenant.id, cursor) : undefined,
				),
			)
			.orderBy(desc(tenant.updatedAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Tenant Occupant handlers ──

export const createTenantOccupant = os.tenant.createOccupant
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["create"] }))
	.handler(async ({ input, errors }) => {
		const { tenantId, ...rest } = input;

		const [parentTenant] = await db
			.select({ id: tenant.id })
			.from(tenant)
			.where(eq(tenant.id, tenantId))
			.limit(1);

		if (!parentTenant) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Tenant",
					resourceId: tenantId,
				},
				message: "Tenant Not Found",
			});
		}

		const [data] = await db
			.insert(tenantOccupant)
			.values({ ...rest, tenantId })
			.returning();

		return data;
	});

export const updateTenantOccupant = os.tenant.updateOccupant
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: tenantOccupant.id })
			.from(tenantOccupant)
			.where(eq(tenantOccupant.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "TenantOccupant",
					resourceId: id,
				},
				message: "Tenant Occupant Not Found",
			});
		}

		const [data] = await db
			.update(tenantOccupant)
			.set(updates)
			.where(eq(tenantOccupant.id, id))
			.returning();

		return data;
	});

export const deleteTenantOccupant = os.tenant.deleteOccupant
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({ id: tenantOccupant.id })
			.from(tenantOccupant)
			.where(eq(tenantOccupant.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "TenantOccupant",
					resourceId: input.id,
				},
				message: "Tenant Occupant Not Found",
			});
		}

		const [data] = await db
			.update(tenantOccupant)
			.set({ status: "inactive" })
			.where(eq(tenantOccupant.id, input.id))
			.returning();

		return data;
	});

export const listTenantOccupant = os.tenant.listOccupants
	.use(authMiddleware)
	.use(permissionMiddleware({ tenant: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { tenantId, cursor, limit, status } = input;
		const { role, userId } = context.user;

		let scopedTenantId = tenantId;
		if (role === "tenant") {
			const [self] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(eq(tenant.userId, userId))
				.limit(1);
			if (!self) throw errors.FORBIDDEN();
			scopedTenantId = self.id;
		}

		const rows = await db
			.select()
			.from(tenantOccupant)
			.where(
				and(
					// eq(tenantOccupant.tenantId, tenantId),
					eq(tenantOccupant.tenantId, scopedTenantId),
					status ? eq(tenantOccupant.status, status) : undefined,
					cursor ? gt(tenantOccupant.id, cursor) : undefined,
				),
			)
			.orderBy(desc(tenantOccupant.updatedAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
