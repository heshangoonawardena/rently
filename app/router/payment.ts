import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { payment, paymentReceipt } from "@/db/schema/payment";
import { lease, leaseRent } from "@/db/schema/lease";
import {
	and,
	desc,
	eq,
	gt,
	inArray,
	isNotNull,
	lte,
	ne,
	sql,
} from "drizzle-orm";
import {
	addMonths,
	endOfMonth,
	format,
	isAfter,
	isBefore,
	parseISO,
	startOfMonth,
} from "date-fns";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { tenant } from "@/db/schema/tenant";

const os = implement(contract).$context<BaseContext>();

function dateOnly(dateValue: string): string {
	return format(parseISO(dateValue), "yyyy-MM-dd");
}

function monthKey(dateValue: Date): string {
	return format(dateValue, "yyyy-MM");
}

function incrementMonth(dateValue: Date): Date {
	return startOfMonth(addMonths(dateValue, 1));
}

async function resolveNextDueRentMonth(
	leaseId: number,
	leaseStartDate: string,
	asOfMonthStart: Date,
): Promise<{ periodStart: string; periodEnd: string } | null> {
	const leaseStartMonth = startOfMonth(parseISO(leaseStartDate));

	const accountedRows = await db
		.select({ periodStart: payment.periodStart })
		.from(payment)
		.where(
			and(
				eq(payment.leaseId, leaseId),
				inArray(payment.paymentType, ["rent", "arrear", "rent_waiver"]),
				isNotNull(payment.periodStart),
				lte(payment.periodStart, format(asOfMonthStart, "yyyy-MM-dd")),
			),
		);

	const accountedMonths = new Set(
		accountedRows
			.map((row) => row.periodStart)
			.filter((periodStart): periodStart is string => Boolean(periodStart))
			.map((periodStart) => monthKey(parseISO(periodStart))),
	);

	let cursor = leaseStartMonth;
	while (cursor.getTime() <= asOfMonthStart.getTime()) {
		const key = monthKey(cursor);
		if (!accountedMonths.has(key)) {
			return {
				periodStart: format(startOfMonth(cursor), "yyyy-MM-dd"),
				periodEnd: format(endOfMonth(cursor), "yyyy-MM-dd"),
			};
		}
		cursor = incrementMonth(cursor);
	}

	return null;
}

async function resolveRentAmountForPeriod(
	leaseId: number,
	periodEnd: string,
): Promise<number | null> {
	const [rentRow] = await db
		.select({ rentAmount: leaseRent.rentAmount })
		.from(leaseRent)
		.where(
			and(
				eq(leaseRent.leaseId, leaseId),
				eq(leaseRent.status, "active"),
				lte(leaseRent.effectiveDate, periodEnd),
			),
		)
		.orderBy(desc(leaseRent.effectiveDate), desc(leaseRent.id))
		.limit(1);

	if (!rentRow) return null;
	return Number(rentRow.rentAmount);
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
	.handler(async ({ input, errors, context }) => {
		const { leaseId, ...paymentData } = input;
		const { role, userId } = context.user;

		const tenantId = await resolveTenantScope(role, userId);
		if (role === "tenant" && tenantId === undefined) throw errors.FORBIDDEN();

		const [parentLease] = await db
			.select({
				id: lease.id,
				status: lease.status,
				tenantId: lease.tenantId,
				startDate: lease.startDate,
				depositAmount: lease.depositAmount,
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
				message: "LEASE_NOT_FOUND",
			});
		}

		if (tenantId !== undefined && parentLease.tenantId !== tenantId) {
			throw errors.FORBIDDEN();
		}

		if (parentLease.status !== "active" && parentLease.status !== "extended") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE_OR_EXTENDED" },
				cause:
					"Payments can only be recorded against active or extended leases",
			});
		}

		const paymentDate = parseISO(paymentData.paymentDate);
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (isAfter(paymentDate, today)) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "FUTURE_PAYMENT_DATE_NOT_ALLOWED" },
				cause: "Payment date cannot be in the future",
			});
		}

		let normalizedPaymentType = paymentData.paymentType;
		let normalizedAmount = paymentData.paymentAmount;
		let normalizedPeriodStart: string | null = null;
		let normalizedPeriodEnd: string | null = null;

		if (
			paymentData.paymentType === "rent" ||
			paymentData.paymentType === "rent_waiver"
		) {
			const paymentMonthStart = startOfMonth(paymentDate);
			const nextDueMonth = await resolveNextDueRentMonth(
				leaseId,
				parentLease.startDate,
				paymentMonthStart,
			);

			if (!nextDueMonth) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "NO_PENDING_RENT_MONTH" },
					cause: "No pending rent month exists for the selected payment date",
				});
			}

			normalizedPeriodStart = nextDueMonth.periodStart;
			normalizedPeriodEnd = nextDueMonth.periodEnd;

			const rentAmount = await resolveRentAmountForPeriod(
				leaseId,
				normalizedPeriodEnd,
			);

			if (rentAmount === null) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_NOT_CONFIGURED" },
					cause: "Cannot record rent payment without an active rent amount",
				});
			}

			if (
				paymentData.paymentType === "rent" &&
				rentAmount !== paymentData.paymentAmount
			) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FULL_RENT_PAYMENT_REQUIRED" },
					cause: "Rent payment amount must match the full current rent amount",
				});
			}

			if (paymentData.paymentType === "rent_waiver") {
				normalizedAmount = rentAmount;
			}

			const [existingMonthlyRentEntry] = await db
				.select({ id: payment.id })
				.from(payment)
				.where(
					and(
						eq(payment.leaseId, leaseId),
						inArray(payment.paymentType, ["rent", "arrear", "rent_waiver"]),
						eq(payment.periodStart, normalizedPeriodStart),
					),
				)
				.limit(1);

			if (existingMonthlyRentEntry) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_ALREADY_RECORDED_FOR_MONTH" },
					cause: "A rent entry for this lease month is already recorded",
				});
			}

			if (paymentData.paymentType === "rent") {
				const periodMonthStart = startOfMonth(parseISO(normalizedPeriodStart));
				if (isBefore(periodMonthStart, paymentMonthStart)) {
					normalizedPaymentType = "arrear";
				}
			}
		}

		if (paymentData.paymentType === "deposit") {
			normalizedPeriodStart = null;
			normalizedPeriodEnd = null;
		}

		if (
			paymentData.paymentType !== "rent" &&
			paymentData.paymentType !== "rent_waiver" &&
			paymentData.paymentType !== "deposit"
		) {
			normalizedPeriodStart = paymentData.periodStart
				? dateOnly(paymentData.periodStart)
				: null;
			normalizedPeriodEnd = paymentData.periodEnd
				? dateOnly(paymentData.periodEnd)
				: null;
		}

		const [newPayment] = await db
			.insert(payment)
			.values({
				paymentType: normalizedPaymentType,
				paymentMethod: paymentData.paymentMethod,
				paymentDate: paymentData.paymentDate,
				paymentAmount: normalizedAmount,
				periodStart: normalizedPeriodStart,
				periodEnd: normalizedPeriodEnd,
				description: paymentData.description,
				leaseId,
			})
			.returning();

		if (paymentData.paymentType === "deposit") {
			await db
				.update(lease)
				.set({
					depositAmount:
						Number(parentLease.depositAmount) + paymentData.paymentAmount,
				})
				.where(eq(lease.id, leaseId));
		}

		if (normalizedPaymentType !== "rent_waiver") {
			const receiptNumber = await generateReceiptNumber();
			await db.insert(paymentReceipt).values({
				paymentId: newPayment.id,
				receiptNumber,
				issuedDate: paymentData.paymentDate,
				amountPaid: normalizedAmount,
			});
		}

		return newPayment;
	});

export const nextRentMonth = os.payment.nextRentMonth
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, errors }) => {
		const [parentLease] = await db
			.select({
				id: lease.id,
				status: lease.status,
				startDate: lease.startDate,
				tenantId: lease.tenantId,
			})
			.from(lease)
			.where(eq(lease.id, input.leaseId))
			.limit(1);

		if (!parentLease) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: input.leaseId,
				},
				message: "LEASE_NOT_FOUND",
			});
		}

		if (parentLease.status !== "active" && parentLease.status !== "extended") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE_OR_EXTENDED" },
				message:
					"Payments can only be recorded against active or extended leases",
			});
		}

		const paymentDate = parseISO(input.paymentDate);
		const paymentMonthStart = startOfMonth(paymentDate);
		const nextDueMonth = await resolveNextDueRentMonth(
			input.leaseId,
			parentLease.startDate,
			paymentMonthStart,
		);

		if (!nextDueMonth) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "NO_PENDING_RENT_MONTH" },
				message: "No pending rent month exists for the selected payment date",
			});
		}

		const rentAmount = await resolveRentAmountForPeriod(
			input.leaseId,
			nextDueMonth.periodEnd,
		);

		if (rentAmount === null) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "RENT_NOT_CONFIGURED" },
				message: "Cannot resolve next rent month without an active rent amount",
			});
		}

		return {
			periodStart: nextDueMonth.periodStart,
			periodEnd: nextDueMonth.periodEnd,
			rentAmount,
			isArrearsRecovery: isBefore(
				startOfMonth(parseISO(nextDueMonth.periodStart)),
				paymentMonthStart,
			),
		};
	});

export const updatePayment = os.payment.update
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, ...updates } = input;

		const [existing] = await db
			.select({ id: payment.id, leaseId: payment.leaseId })
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

		const [parentLease] = await db
			.select({
				startDate: lease.startDate,
				depositAmount: lease.depositAmount,
			})
			.from(lease)
			.where(eq(lease.id, existing.leaseId))
			.limit(1);

		if (!parentLease) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: existing.leaseId,
				},
				message: "LEASE_NOT_FOUND",
			});
		}

		if (updates.paymentType === "rent") {
			const paymentDate = parseISO(updates.paymentDate);
			const paymentMonthStart = startOfMonth(paymentDate);

			const inputPeriodStart = parseISO(updates.periodStart);
			const normalizedPeriodStart = startOfMonth(inputPeriodStart);
			const normalizedPeriodEnd = endOfMonth(inputPeriodStart);

			const normalizedPeriodStartStr = format(
				normalizedPeriodStart,
				"yyyy-MM-dd",
			);
			const normalizedPeriodEndStr = format(normalizedPeriodEnd, "yyyy-MM-dd");
			const leaseStartMonthStart = startOfMonth(
				parseISO(parentLease.startDate),
			);

			if (isBefore(normalizedPeriodStart, leaseStartMonthStart)) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_PERIOD_BEFORE_LEASE_START" },
					cause: "Cannot record rent for a month before lease start",
				});
			}

			if (isAfter(normalizedPeriodStart, paymentMonthStart)) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FUTURE_RENT_PERIOD_NOT_ALLOWED" },
					message: "Cannot record rent for a future month",
				});
			}

			if (
				dateOnly(updates.periodStart) !== normalizedPeriodStartStr ||
				dateOnly(updates.periodEnd) !== normalizedPeriodEndStr
			) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "INVALID_RENT_PERIOD_BOUNDARY" },
					cause:
						"Rent payment period must match the exact first and last day of one month",
				});
			}

			const [currentRentRow] = await db
				.select({ rentAmount: leaseRent.rentAmount })
				.from(leaseRent)
				.where(
					and(
						eq(leaseRent.leaseId, existing.leaseId),
						eq(leaseRent.status, "active"),
						lte(leaseRent.effectiveDate, normalizedPeriodEndStr),
					),
				)
				.orderBy(desc(leaseRent.effectiveDate), desc(leaseRent.id))
				.limit(1);

			if (!currentRentRow) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_NOT_CONFIGURED" },
					cause: "Cannot record rent payment without an active rent amount",
				});
			}

			if (Number(currentRentRow.rentAmount) !== updates.paymentAmount) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FULL_RENT_PAYMENT_REQUIRED" },
					cause: "Rent payment amount must match the full current rent amount",
				});
			}

			const [existingMonthlyRentPayment] = await db
				.select({ id: payment.id })
				.from(payment)
				.where(
					and(
						eq(payment.leaseId, existing.leaseId),
						eq(payment.paymentType, "rent"),
						eq(payment.periodStart, normalizedPeriodStartStr),
						ne(payment.id, id),
					),
				)
				.limit(1);

			if (existingMonthlyRentPayment) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_ALREADY_RECORDED_FOR_MONTH" },
					cause: "A rent payment for this lease month is already recorded",
				});
			}

			updates.periodStart = normalizedPeriodStartStr;
			updates.periodEnd = normalizedPeriodEndStr;
		}

		if (updates.paymentType === "deposit") {
			if (Number(parentLease.depositAmount) !== updates.paymentAmount) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FULL_DEPOSIT_PAYMENT_REQUIRED" },
					cause:
						"Deposit payment amount must match the full lease deposit amount",
				});
			}
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
		let tenantLeaseIds: number[] | undefined;
		if (role === "tenant") {
			if (tenantId === undefined) throw errors.FORBIDDEN();
			// Get all units where tenant has active leases
			const leaseRows = await db
				.select({ leaseId: lease.id })
				.from(lease)
				.where(and(eq(lease.tenantId, tenantId), eq(lease.status, "active")));
			tenantLeaseIds = leaseRows.map((row) => row.leaseId);
		}

		const rows = await db
			.select()
			.from(payment)
			.where(
				and(
					leaseId ? eq(payment.leaseId, leaseId) : undefined,
					paymentType ? eq(payment.paymentType, paymentType) : undefined,
					cursor ? gt(payment.id, cursor) : undefined,
					role === "tenant" && tenantLeaseIds
						? tenantLeaseIds.length > 0
							? inArray(payment.leaseId, tenantLeaseIds)
							: undefined
						: undefined,
				),
			)
			.orderBy(desc(payment.updatedAt), desc(payment.paymentDate))
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
