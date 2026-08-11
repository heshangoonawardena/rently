import { implement } from "@orpc/server";
import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import { db } from "@/db/db";
import { lease, leaseRent } from "@/db/schema/lease";
import { tenant } from "@/db/schema/tenant";
import { unit } from "@/db/schema/unit";
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
 * Verify that a tenant has an active lease on a given unit.
 */
async function _tenantHasLeaseOnUnit(
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

export const createUnit = os.unit.create
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["create"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;
		const [existing] = await db
			.select({
				id: unit.id,
			})
			.from(unit)
			.where(eq(unit.name, input.name))
			.limit(1);

		if (existing) {
			throw errors.CONFLICT({
				data: {
					field: "name",
					value: input.name,
				},
				message: "Unit already exists",
			});
		}

		const data = await db
			.insert(unit)
			.values({
				...input,
				organizationId,
			})
			.returning();

		return data[0];
	});

export const updateUnit = os.unit.update
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, ...updates } = input;

		const data = await db
			.update(unit)
			.set(updates)
			.where(eq(unit.id, id))
			.returning();

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceId: id,
					resourceType: "Unit",
				},
				message: "Unit not found",
			});
		}

		return data[0];
	});

export const deleteUnit = os.unit.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select()
			.from(unit)
			.where(eq(unit.id, input.id))
			.limit(1);
		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceId: input.id,
					resourceType: "Unit",
				},
				message: "Unit not found",
			});
		}

		// Prevent deletion if active leases exist
		const [activeLease] = await db
			.select({ id: lease.id })
			.from(lease)
			.where(
				and(
					eq(lease.unitId, input.id),
					or(eq(lease.status, "active"), eq(lease.status, "extended")),
				),
			)
			.limit(1);

		if (activeLease) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "UNIT_HAS_ACTIVE_LEASE" },
				message: "Cannot delete a unit with an active lease",
			});
		}

		const data = await db
			.update(unit)
			.set({ status: "inactive" })
			.where(eq(unit.id, input.id))
			.returning();

		return data[0];
	});

export const getUnit = os.unit.get
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;

		const [data] = await db
			.select()
			.from(unit)
			.where(
				and(eq(unit.id, input.id), eq(unit.organizationId, organizationId)),
			)
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Unit",
					resourceId: input.id,
				},
				message: "Unit not found",
			});
		}

		return data;
	});

export const listUnit = os.unit.list
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["read"] }))
	.handler(async ({ input, context, errors }) => {
		const { cursor, limit, status, id } = input;
		const { role, userId, organizationId } = context.user;

		const tenantId = await resolveTenantId(role, userId);
		let tenantUnitIds: number[] | undefined;
		if (role === "tenant") {
			if (tenantId === undefined) throw errors.FORBIDDEN();
			const leaseRows = await db
				.select({ unitId: lease.unitId })
				.from(lease)
				.where(and(eq(lease.tenantId, tenantId), eq(lease.status, "active")));
			tenantUnitIds = leaseRows.map((row) => row.unitId);
		}

		const rows = await db
			.select()
			.from(unit)
			.where(
				and(
					eq(unit.organizationId, organizationId),
					id ? eq(unit.id, id) : undefined,
					status ? eq(unit.status, status) : undefined,
					cursor ? gt(unit.id, cursor) : undefined,
					role === "tenant" && tenantUnitIds
						? tenantUnitIds.length > 0
							? inArray(unit.id, tenantUnitIds)
							: undefined
						: undefined,
				),
			)
			.orderBy(desc(unit.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const unitRows = hasMore ? rows.slice(0, limit) : rows;

		if (unitRows.length === 0) {
			return { items: [], nextCursor: null };
		}

		const unitIds = unitRows.map((u) => u.id);

		// Fetch active/extended leases for these units
		const leaseRows = await db
			.select()
			.from(lease)
			.where(
				and(
					inArray(lease.unitId, unitIds),
					or(eq(lease.status, "active"), eq(lease.status, "extended")),
				),
			);

		if (leaseRows.length === 0) {
			return {
				items: unitRows.map((u) => ({ ...u, activeLease: null })),
				nextCursor: hasMore ? unitRows[unitRows.length - 1].id : null,
			};
		}

		const leaseIds = leaseRows.map((l) => l.id);
		const tenantIds = [...new Set(leaseRows.map((l) => l.tenantId))];

		const [rentRows, tenantRows] = await Promise.all([
			db
				.select()
				.from(leaseRent)
				.where(
					and(
						inArray(leaseRent.leaseId, leaseIds),
						eq(leaseRent.status, "active"),
					),
				)
				.orderBy(desc(leaseRent.effectiveDate)),
			db.select().from(tenant).where(inArray(tenant.id, tenantIds)),
		]);

		// Most recent active rent row per lease
		const currentRentByLease = new Map<number, (typeof rentRows)[number]>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, r);
			}
		}

		const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

		// One active lease per unit (enforced by DB unique index)
		const activeLeaseByUnit = new Map(leaseRows.map((l) => [l.unitId, l]));

		const items = unitRows.map((u) => {
			const activeLease = activeLeaseByUnit.get(u.id);

			if (!activeLease) {
				return { ...u, activeLease: null };
			}

			return {
				...u,
				activeLease: {
					...activeLease,
					currentRent: currentRentByLease.get(activeLease.id) ?? null,
					tenant: tenantById.get(activeLease.tenantId)!,
				},
			};
		});

		return {
			items,
			nextCursor: hasMore ? unitRows[unitRows.length - 1].id : null,
		};
	});
