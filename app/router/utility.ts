import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { utility, utilityBill } from "@/db/schema/utility";
import { and, desc, eq, gt } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { tenant } from "@/db/schema/tenant";
import { lease } from "@/db/schema/lease";

const os = implement(contract).$context<BaseContext>();

/**
 * Verify a tenant user can access a specific unit — they must have an active
 * lease on that unit.
 */
async function assertTenantCanAccessUnit(
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

// ── Utility account handlers ──

export const createUtility = os.utility.create
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["create"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({ id: utility.id })
			.from(utility)
			.where(eq(utility.accountNumber, input.accountNumber))
			.limit(1);

		if (existing) {
			throw errors.CONFLICT({
				data: {
					field: "accountNumber",
					value: input.accountNumber,
				},
				cause: "UTILITY_ALREADY_EXISTS",
			});
		}

		const [data] = await db.insert(utility).values(input).returning();

		return data;
	});

export const updateUtility = os.utility.update
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: utility.id })
			.from(utility)
			.where(eq(utility.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Utility",
					resourceId: id,
				},
				cause: "UTILITY_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(utility)
			.set(updates)
			.where(eq(utility.id, id))
			.returning();

		return data;
	});

export const deactivateUtility = os.utility.deactivate
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["update"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({
				id: utility.id,
				status: utility.status,
			})
			.from(utility)
			.where(eq(utility.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Utility",
					resourceId: input.id,
				},
				cause: "UTILITY_NOT_FOUND",
			});
		}

		if (existing.status === "inactive") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "UTILITY_ALREADY_INACTIVE" },
				cause: "Utility account is already inactive",
			});
		}

		const [data] = await db
			.update(utility)
			.set({ status: "inactive" })
			.where(eq(utility.id, input.id))
			.returning();

		return data;
	});

export const deleteUtility = os.utility.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [bill] = await db
			.select({ id: utilityBill.id })
			.from(utilityBill)
			.where(eq(utilityBill.utilityId, input.id))
			.limit(1);

		// Prevent deletion if bills exist
		if (bill) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "UTILITY_HAS_BILLS" },
				cause: "Cannot delete a utility account with attached bills",
			});
		}

		const [data] = await db
			.delete(utility)
			.where(eq(utility.id, input.id))
			.returning();

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Utility",
					resourceId: input.id,
				},
				cause: "UTILITY_NOT_FOUND",
			});
		}

		return data;
	});

export const listUtility = os.utility.list
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { unitId, cursor, limit, status } = input;
		const { role, userId } = context.user;

		// Tenants may only list utilities for units they actively lease
		if (role === "tenant") {
			const allowed = await assertTenantCanAccessUnit(userId, unitId);
			if (!allowed) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select()
			.from(utility)
			.where(
				and(
					eq(utility.unitId, unitId),
					status ? eq(utility.status, status) : undefined,
					cursor ? gt(utility.id, cursor) : undefined,
				),
			)
			.orderBy(desc(utility.updatedAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Utility Bill handlers ──

export const createUtilityBill = os.utility.createBill
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["create"] }))
	.handler(async ({ input, errors }) => {
		const { utilityId, ...billData } = input;

		const [parentUtility] = await db
			.select({ id: utility.id })
			.from(utility)
			.where(eq(utility.id, utilityId))
			.limit(1);

		if (!parentUtility) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Utility",
					resourceId: utilityId,
				},
				cause: "UTILITY_NOT_FOUND",
			});
		}

		const [data] = await db
			.insert(utilityBill)
			.values({ ...billData, utilityId })
			.returning();

		return data;
	});

export const updateUtilityBill = os.utility.updateBill
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({
				id: utilityBill.id,
				status: utilityBill.status,
			})
			.from(utilityBill)
			.where(eq(utilityBill.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "UtilityBill",
					resourceId: id,
				},
				cause: "UTILITY_BILL_NOT_FOUND",
			});
		}

		if (existing.status === "discarded") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "BILL_NOT_EDITABLE" },
				cause: "Discarded bills are not editable",
			});
		}

		const [data] = await db
			.update(utilityBill)
			.set(updates)
			.where(eq(utilityBill.id, id))
			.returning();

		return data;
	});

export const markUtilityBillPaid = os.utility.markBillPaid
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["update"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({
				id: utilityBill.id,
				status: utilityBill.status,
			})
			.from(utilityBill)
			.where(eq(utilityBill.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "UtilityBill",
					resourceId: input.id,
				},
				cause: "UTILITY_BILL_NOT_FOUND",
			});
		}

		if (existing.status !== "issued") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "BILL_NOT_PAYABLE" },
				cause: "Only issued bills can be marked as paid",
			});
		}

		const [data] = await db
			.update(utilityBill)
			.set({ status: "paid" })
			.where(eq(utilityBill.id, input.id))
			.returning();

		return data;
	});

export const deleteUtilityBill = os.utility.deleteBill
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["delete"] }))
	.handler(async ({ input, errors }) => {
		const [existing] = await db
			.select({
				id: utilityBill.id,
				status: utilityBill.status,
			})
			.from(utilityBill)
			.where(eq(utilityBill.id, input.id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "UtilityBill",
					resourceId: input.id,
				},
				cause: "UTILITY_BILL_NOT_FOUND",
			});
		}

		if (existing.status !== "issued") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "BILL_NOT_DELETABLE" },
				cause: "Only issued bills can be deleted",
			});
		}

		const [data] = await db
			.update(utilityBill)
			.set({ status: "discarded" })
			.where(eq(utilityBill.id, input.id))
			.returning();

		return data;
	});

export const listUtilityBill = os.utility.listBills
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { utilityId, cursor, limit, status } = input;
		const { role, userId } = context.user;

		// Tenants may only read bills for utilities on their own unit
		if (role === "tenant") {
			const [parentUtility] = await db
				.select({ unitId: utility.unitId })
				.from(utility)
				.where(eq(utility.id, utilityId))
				.limit(1);

			if (!parentUtility) {
				throw errors.NOT_FOUND({
					data: { resourceType: "Utility", resourceId: utilityId },
					cause: "UTILITY_NOT_FOUND",
				});
			}

			const allowed = await assertTenantCanAccessUnit(
				userId,
				parentUtility.unitId,
			);
			if (!allowed) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select()
			.from(utilityBill)
			.where(
				and(
					eq(utilityBill.utilityId, utilityId),
					status ? eq(utilityBill.status, status) : undefined,
					cursor ? gt(utilityBill.id, cursor) : undefined,
				),
			)
			.orderBy(desc(utilityBill.createdAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
