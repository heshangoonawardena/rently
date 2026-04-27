import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { payment, paymentReceipt } from "@/db/schema/payment";
import { lease } from "@/db/schema/lease";
import { and, desc, eq, gt, sql, sum } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { tenant } from "@/db/schema/tenant";

const os = implement(contract).$context<BaseContext>();

/** Compute the current running balance for a lease from all prior payments. */
async function getRunningBalance(leaseId: number): Promise<number> {
	const [row] = await db
		.select({ balance: lease.depositAmount })
		.from(lease)
		.where(eq(lease.id, leaseId))
		.limit(1);

	if (!row) return 0;

	// Latest balanceAfter is the current balance
	const [latest] = await db
		.select({ balanceAfter: payment.balanceAfter })
		.from(payment)
		.where(eq(payment.leaseId, leaseId))
		.orderBy(desc(payment.createdAt))
		.limit(1);

	return latest ? parseFloat(latest.balanceAfter) : 0;
}

/** Generate a sequential receipt number scoped to the org. */
async function generateReceiptNumber(): Promise<string> {
	const year = new Date().getFullYear();
	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(paymentReceipt);
	const seq = String(Number(count) + 1).padStart(5, "0");
	return `RCP-${year}-${seq}`;
}

/**
 * Resolve the tenant record for the authenticated user, if the role is 'tenant'.
 * Returns undefined for owner/manager (no scoping needed).
 */
async function resolveTenantScope(
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

// ── Payment handlers ──

export const createPayment = os.payment.create
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["create"] }))
	.handler(async ({ input, errors }) => {
		const { leaseId, ...paymentData } = input;

		const [parentLease] = await db
			.select({
				id: lease.id,
				status: lease.status,
			})
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

		if (parentLease.status !== "active" && parentLease.status !== "extended") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE_OR_EXTENDED" },
				cause:
					"Payments can only be recorded against active or extended leases",
			});
		}

		const currentBalance = await getRunningBalance(leaseId);
		const amount = parseFloat(paymentData.paymentAmount);

		// Simple balance calculation: positive = credit, negative = arrears
		const balanceAfter =
			paymentData.paymentType === "deposit" ||
			paymentData.paymentType === "rent" ||
			paymentData.paymentType === "partial_rent" ||
			paymentData.paymentType === "arrear"
				? currentBalance + amount
				: currentBalance - amount; // refunds and deductions reduce the balance

		const [newPayment] = await db
			.insert(payment)
			.values({
				...paymentData,
				leaseId,
				balanceAfter: balanceAfter.toFixed(2),
			})
			.returning();

		const receiptNumber = await generateReceiptNumber();
		await db.insert(paymentReceipt).values({
			paymentId: newPayment.id,
			receiptNumber,
			issuedDate: paymentData.paymentDate,
			amountPaid: paymentData.paymentAmount,
			balanceAfter: balanceAfter.toFixed(2),
		});

		return newPayment;
	});

export const updatePayment = os.payment.update
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: payment.id })
			.from(payment)
			.where(eq(payment.id, id))
			.limit(1);

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Payment",
					resourceId: id,
				},
				cause: "PAYMENT_NOT_FOUND",
			});
		}

		const [data] = await db
			.update(payment)
			.set(updates)
			.where(eq(payment.id, id))
			.returning();

		return data;
	});

export const getPayment = os.payment.get
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { role, userId } = context.user;

		// Tenants may only read payments on their own leases
		const tenantId = await resolveTenantScope(role, userId);
		if (role === "tenant" && tenantId === undefined) throw errors.FORBIDDEN();

		// If tenant, verify the lease belongs to them before reading
		if (tenantId !== undefined) {
			const [parentLease] = await db
				.select({ id: lease.id })
				.from(lease)
				.where(and(eq(lease.id, input.leaseId), eq(lease.tenantId, tenantId)))
				.limit(1);
			if (!parentLease) throw errors.FORBIDDEN();
		}

		const [data] = await db
			.select()
			.from(payment)
			.where(and(eq(payment.id, input.id), eq(payment.leaseId, input.leaseId)))
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Payment",
					resourceId: input.id,
				},
				cause: "PAYMENT_NOT_FOUND",
			});
		}

		return data;
	});

export const listPayment = os.payment.list
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { leaseId, cursor, limit, paymentType } = input;
		const { role, userId } = context.user;

		// Tenants may only list payments on their own leases
		const tenantId = await resolveTenantScope(role, userId);
		if (role === "tenant" && tenantId === undefined) throw errors.FORBIDDEN();

		if (tenantId !== undefined) {
			const [parentLease] = await db
				.select({ id: lease.id })
				.from(lease)
				.where(and(eq(lease.id, leaseId), eq(lease.tenantId, tenantId)))
				.limit(1);
			if (!parentLease) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select()
			.from(payment)
			.where(
				and(
					eq(payment.leaseId, leaseId),
					paymentType ? eq(payment.paymentType, paymentType) : undefined,
					cursor ? gt(payment.id, cursor) : undefined,
				),
			)
			.orderBy(desc(payment.paymentDate))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});

// ── Receipt handlers ──

export const getReceipt = os.payment.getReceipt
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { role, userId } = context.user;

		const [data] = await db
			.select()
			.from(paymentReceipt)
			.where(eq(paymentReceipt.id, input.id))
			.limit(1);

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "PaymentReceipt",
					resourceId: input.id,
				},
				cause: "RECEIPT_NOT_FOUND",
			});
		}

		// Tenants may only read receipts tied to their own leases
		if (role === "tenant") {
			const tenantId = await resolveTenantScope(role, userId);
			if (tenantId === undefined) throw errors.FORBIDDEN();

			const [parentPayment] = await db
				.select({ leaseId: payment.leaseId })
				.from(payment)
				.where(eq(payment.id, data.paymentId))
				.limit(1);

			if (!parentPayment) throw errors.FORBIDDEN();

			const [parentLease] = await db
				.select({ id: lease.id })
				.from(lease)
				.where(
					and(
						eq(lease.id, parentPayment.leaseId),
						eq(lease.tenantId, tenantId),
					),
				)
				.limit(1);

			if (!parentLease) throw errors.FORBIDDEN();
		}

		return data;
	});

export const listReceipts = os.payment.listReceipts
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { leaseId, cursor, limit } = input;
		const { role, userId } = context.user;

		// Tenants may only list receipts on their own leases
		const tenantId = await resolveTenantScope(role, userId);
		if (role === "tenant" && tenantId === undefined) throw errors.FORBIDDEN();

		if (tenantId !== undefined) {
			const [parentLease] = await db
				.select({ id: lease.id })
				.from(lease)
				.where(and(eq(lease.id, leaseId), eq(lease.tenantId, tenantId)))
				.limit(1);
			if (!parentLease) throw errors.FORBIDDEN();
		}

		const rows = await db
			.select({ receipt: paymentReceipt })
			.from(paymentReceipt)
			.innerJoin(payment, eq(payment.id, paymentReceipt.paymentId))
			.where(
				and(
					eq(payment.leaseId, leaseId),
					cursor ? gt(paymentReceipt.id, cursor) : undefined,
				),
			)
			.orderBy(desc(paymentReceipt.issuedDate))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore
			? rows.slice(0, limit).map((r) => r.receipt)
			: rows.map((r) => r.receipt);

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
