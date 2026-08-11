import { implement } from "@orpc/server";
import {
	addDays,
	addMonths,
	endOfMonth,
	format,
	isAfter,
	isBefore,
	parseISO,
	startOfMonth,
} from "date-fns";
import {
	and,
	desc,
	eq,
	ilike,
	inArray,
	isNotNull,
	lt,
	lte,
	ne,
} from "drizzle-orm";
import { db } from "@/db/db";
import { lease, leaseRent } from "@/db/schema/lease";
import { payment } from "@/db/schema/payment";
import { tenant } from "@/db/schema/tenant";
import { unit } from "@/db/schema/unit";
import { resolveDepositBalanceDelta } from "@/lib/payment-utils";
import {
	generateNextReceiptNumber,
	isValidReceiptNumber,
} from "@/lib/receipt-number";
import { contract } from "../contract";
import {
	authMiddleware,
	type BaseContext,
	permissionMiddleware,
} from "./middleware";

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

function cycleStartForMonth(monthStart: Date, leaseAnchorDay: number): Date {
	const monthEndDay = endOfMonth(monthStart).getDate();
	const dayOfMonth = Math.min(leaseAnchorDay, monthEndDay);

	const cycleStart = new Date(monthStart);
	cycleStart.setDate(dayOfMonth);

	return cycleStart;
}

function resolveLeaseCyclePeriod(
	cycleMonthStart: Date,
	leaseAnchorDay: number,
): { periodStart: string; periodEnd: string } {
	const periodStartDate = cycleStartForMonth(
		startOfMonth(cycleMonthStart),
		leaseAnchorDay,
	);
	const nextCycleStartDate = cycleStartForMonth(
		startOfMonth(addMonths(cycleMonthStart, 1)),
		leaseAnchorDay,
	);
	const periodEndDate = addDays(nextCycleStartDate, -1);

	return {
		periodStart: format(periodStartDate, "yyyy-MM-dd"),
		periodEnd: format(periodEndDate, "yyyy-MM-dd"),
	};
}

async function resolveNextDueRentMonth(
	leaseId: number,
	leaseStartDate: string,
	asOfDate: Date,
	agreedPaymentDay: number,
): Promise<{ periodStart: string; periodEnd: string } | null> {
	const leaseStartDateValue = parseISO(leaseStartDate);
	const leaseStartMonth = startOfMonth(leaseStartDateValue);
	const leaseAnchorDay = leaseStartDateValue.getDate();
	const asOfMonthStart = startOfMonth(asOfDate);
	const effectiveDueDay = Math.min(
		agreedPaymentDay,
		endOfMonth(asOfMonthStart).getDate(),
	);
	const canPrepayCurrentCycle = asOfDate.getDate() <= effectiveDueDay;
	const currentMonthKey = monthKey(asOfMonthStart);

	const accountedRows = await db
		.select({ periodStart: payment.periodStart })
		.from(payment)
		.where(
			and(
				eq(payment.leaseId, leaseId),
				inArray(payment.paymentType, ["rent", "arrear", "rent_waiver"]),
				isNotNull(payment.periodStart),
			),
		);

	const accountedMonths = new Set(
		accountedRows
			.map((row) => row.periodStart)
			.filter((periodStart): periodStart is string => Boolean(periodStart))
			.map((periodStart) => monthKey(parseISO(periodStart))),
	);

	let cursor = leaseStartMonth;
	while (true) {
		const cursorCycleStart = cycleStartForMonth(cursor, leaseAnchorDay);
		const key = monthKey(cursor);
		const isFutureCycle = cursorCycleStart.getTime() > asOfDate.getTime();
		const isEligibleCurrentMonthPrepayment =
			canPrepayCurrentCycle && key === currentMonthKey;

		if (isFutureCycle && !isEligibleCurrentMonthPrepayment) {
			break;
		}

		if (!accountedMonths.has(key)) {
			return resolveLeaseCyclePeriod(cursor, leaseAnchorDay);
		}

		cursor = incrementMonth(cursor);
	}

	return null;
}

async function resolveAgreedPaymentDayForDate(
	leaseId: number,
	asOfDate: string,
): Promise<number | null> {
	const [rentRow] = await db
		.select({ agreedPaymentDay: leaseRent.agreedPaymentDay })
		.from(leaseRent)
		.where(
			and(
				eq(leaseRent.leaseId, leaseId),
				eq(leaseRent.status, "active"),
				lte(leaseRent.effectiveDate, asOfDate),
			),
		)
		.orderBy(desc(leaseRent.effectiveDate), desc(leaseRent.id))
		.limit(1);

	if (!rentRow) return null;
	return rentRow.agreedPaymentDay;
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
	const [latestReceipt] = await db
		.select({ receiptNumber: payment.receiptNumber })
		.from(payment)
		.where(
			and(
				isNotNull(payment.receiptNumber),
				ilike(payment.receiptNumber, `RCP-${year}-%`),
			),
		)
		.orderBy(desc(payment.createdAt), desc(payment.id))
		.limit(1);

	return generateNextReceiptNumber(
		latestReceipt?.receiptNumber,
		new Date(year, 0, 1),
	);
}

/**
 * Resolve the tenant record for the authenticated user, if the role is 'tenant'.
 * Returns undefined for owner/manager (no scoping needed).
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

function mapPaymentWithLeaseSummary(row: {
	id: number;
	leaseId: number;
	paymentType: typeof payment.$inferSelect.paymentType;
	paymentMethod: typeof payment.$inferSelect.paymentMethod;
	paymentDate: string;
	paymentAmount: number;
	periodStart: string | null;
	periodEnd: string | null;
	receiptNumber: string | null;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	leaseStatus: typeof lease.$inferSelect.status | null;
	leaseStartDate: string | null;
	unitName: string | null;
	unitAddress: string | null;
	tenantFirstName: string | null;
	tenantLastName: string | null;
	tenantPhoneNumber: string | null;
}) {
	const tenantName = [row.tenantFirstName, row.tenantLastName]
		.filter(Boolean)
		.join(" ")
		.trim();

	return {
		id: row.id,
		leaseId: row.leaseId,
		paymentType: row.paymentType,
		paymentMethod: row.paymentMethod,
		paymentDate: row.paymentDate,
		paymentAmount: row.paymentAmount,
		periodStart: row.periodStart,
		periodEnd: row.periodEnd,
		receiptNumber: row.receiptNumber,
		description: row.description,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		leaseSummary:
			row.leaseStatus && row.leaseStartDate && row.unitName && row.unitAddress
				? {
						leaseStatus: row.leaseStatus,
						leaseStartDate: row.leaseStartDate,
						unitName: row.unitName,
						unitAddress: row.unitAddress,
						tenantName: tenantName || "Unknown tenant",
						tenantPhoneNumber: row.tenantPhoneNumber,
					}
				: null,
	};
}

// ── Payment handlers ──

export const createPayment = os.payment.create
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["create"] }))
	.handler(async ({ input, errors, context }) => {
		const { leaseId, ...paymentData } = input;
		const { role, userId } = context.user;

		const tenantId = await resolveTenantId(role, userId);
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
				message: "Lease Not Found",
			});
		}

		if (tenantId !== undefined && parentLease.tenantId !== tenantId) {
			throw errors.FORBIDDEN();
		}

		if (parentLease.status !== "active" && parentLease.status !== "extended") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE_OR_EXTENDED" },
				message:
					"Payments can only be recorded against active or extended leases",
			});
		}

		const paymentDate = parseISO(paymentData.paymentDate);
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (isAfter(paymentDate, today)) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "FUTURE_PAYMENT_DATE_NOT_ALLOWED" },
				message: "Payment date cannot be in the future",
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
			const agreedPaymentDay = await resolveAgreedPaymentDayForDate(
				leaseId,
				paymentData.paymentDate,
			);

			if (agreedPaymentDay === null) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_NOT_CONFIGURED" },
					message: "Cannot record rent payment without an active rent amount",
				});
			}

			const nextDueMonth = await resolveNextDueRentMonth(
				leaseId,
				parentLease.startDate,
				paymentDate,
				agreedPaymentDay,
			);

			if (!nextDueMonth) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "NO_PENDING_RENT_MONTH" },
					message: "No pending rent month exists for the selected payment date",
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
					message: "Cannot record rent payment without an active rent amount",
				});
			}

			if (
				paymentData.paymentType === "rent" &&
				rentAmount !== paymentData.paymentAmount
			) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FULL_RENT_PAYMENT_REQUIRED" },
					message:
						"Rent payment amount must match the full current rent amount",
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
					message: "A rent entry for this lease month is already recorded",
				});
			}

			if (paymentData.paymentType === "rent") {
				const paymentMonthStart = startOfMonth(paymentDate);
				const periodMonthStart = startOfMonth(parseISO(normalizedPeriodStart));
				if (isBefore(periodMonthStart, paymentMonthStart)) {
					normalizedPaymentType = "arrear";
				}
			}
		}

		if (
			paymentData.paymentType === "deposit" ||
			paymentData.paymentType === "deposit_deduction"
		) {
			normalizedPeriodStart = null;
			normalizedPeriodEnd = null;
		}

		if (
			paymentData.paymentType !== "rent" &&
			paymentData.paymentType !== "rent_waiver" &&
			paymentData.paymentType !== "deposit" &&
			paymentData.paymentType !== "deposit_deduction"
		) {
			normalizedPeriodStart = paymentData.periodStart
				? dateOnly(paymentData.periodStart)
				: null;
			normalizedPeriodEnd = paymentData.periodEnd
				? dateOnly(paymentData.periodEnd)
				: null;
		}

		const isDepositAdjustment =
			paymentData.paymentType === "deposit" ||
			paymentData.paymentType === "deposit_deduction";
		let nextDepositAmount: number | null = null;

		if (isDepositAdjustment) {
			const depositDelta = resolveDepositBalanceDelta(
				paymentData.paymentType,
				paymentData.paymentAmount,
			);
			nextDepositAmount = Number(parentLease.depositAmount) + depositDelta;
			const rentAmount = await resolveRentAmountForPeriod(
				leaseId,
				paymentData.paymentDate,
			);

			if (nextDepositAmount < (rentAmount ?? 0)) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "DEPOSIT_BALANCE_CANNOT_BE_BELOW_RENT" },
					message:
						"Deposit deduction cannot reduce the lease deposit balance below the current rent amount",
				});
			}
		}

		const receiptNumber = await generateReceiptNumber();

		const newPayment = await db.transaction(async (tx) => {
			const [insertedPayment] = await tx
				.insert(payment)
				.values({
					paymentType: normalizedPaymentType,
					paymentMethod: paymentData.paymentMethod,
					paymentDate: paymentData.paymentDate,
					paymentAmount: normalizedAmount,
					periodStart: normalizedPeriodStart,
					periodEnd: normalizedPeriodEnd,
					receiptNumber,
					description: paymentData.description,
					leaseId,
				})
				.returning();

			if (nextDepositAmount !== null) {
				await tx
					.update(lease)
					.set({
						depositAmount: nextDepositAmount,
					})
					.where(eq(lease.id, leaseId));
			}

			return insertedPayment;
		});

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
		const agreedPaymentDay = await resolveAgreedPaymentDayForDate(
			input.leaseId,
			input.paymentDate,
		);

		if (agreedPaymentDay === null) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "RENT_NOT_CONFIGURED" },
				message: "Cannot resolve next rent month without an active rent amount",
			});
		}

		const nextDueMonth = await resolveNextDueRentMonth(
			input.leaseId,
			parentLease.startDate,
			paymentDate,
			agreedPaymentDay,
		);
		const paymentMonthStart = startOfMonth(paymentDate);

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
			const expectedPeriod = resolveLeaseCyclePeriod(
				startOfMonth(inputPeriodStart),
				parseISO(parentLease.startDate).getDate(),
			);

			const normalizedPeriodStartStr = expectedPeriod.periodStart;
			const normalizedPeriodEndStr = expectedPeriod.periodEnd;
			const normalizedPeriodStart = parseISO(normalizedPeriodStartStr);
			const leaseStartMonthStart = startOfMonth(
				parseISO(parentLease.startDate),
			);

			if (isBefore(normalizedPeriodStart, leaseStartMonthStart)) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "RENT_PERIOD_BEFORE_LEASE_START" },
					message: "Cannot record rent for a month before lease start",
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
					message:
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
					message: "Cannot record rent payment without an active rent amount",
				});
			}

			if (Number(currentRentRow.rentAmount) !== updates.paymentAmount) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FULL_RENT_PAYMENT_REQUIRED" },
					message:
						"Rent payment amount must match the full current rent amount",
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
					message: "A rent payment for this lease month is already recorded",
				});
			}

			updates.periodStart = normalizedPeriodStartStr;
			updates.periodEnd = normalizedPeriodEndStr;
		}

		if (updates.paymentType === "deposit") {
			if (Number(parentLease.depositAmount) !== updates.paymentAmount) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "FULL_DEPOSIT_PAYMENT_REQUIRED" },
					message:
						"Deposit payment amount must match the full lease deposit amount",
				});
			}
		}

		const [data] = await db
			.update(payment)
			.set({
				...updates,
				receiptNumber:
					updates.receiptNumber && isValidReceiptNumber(updates.receiptNumber)
						? updates.receiptNumber
						: (updates.receiptNumber ?? null),
			})
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
		const tenantId = await resolveTenantId(role, userId);
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
			.select({
				id: payment.id,
				leaseId: payment.leaseId,
				paymentType: payment.paymentType,
				paymentMethod: payment.paymentMethod,
				paymentDate: payment.paymentDate,
				paymentAmount: payment.paymentAmount,
				periodStart: payment.periodStart,
				periodEnd: payment.periodEnd,
				receiptNumber: payment.receiptNumber,
				description: payment.description,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				leaseStatus: lease.status,
				leaseStartDate: lease.startDate,
				unitName: unit.name,
				unitAddress: unit.address,
				tenantFirstName: tenant.firstName,
				tenantLastName: tenant.lastName,
				tenantPhoneNumber: tenant.phoneNumber,
			})
			.from(payment)
			.leftJoin(lease, eq(payment.leaseId, lease.id))
			.leftJoin(unit, eq(lease.unitId, unit.id))
			.leftJoin(tenant, eq(lease.tenantId, tenant.id))
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

		return mapPaymentWithLeaseSummary(data);
	});

export const listPayment = os.payment.list
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { leaseId, cursor, limit, paymentType } = input;
		const { role, userId } = context.user;

		// Tenants may only list payments on their own active leases
		const tenantId = await resolveTenantId(role, userId);
		let tenantLeaseIds: number[] | undefined;
		if (role === "tenant") {
			if (tenantId === undefined) {
				throw errors.FORBIDDEN();
			}

			const leaseRows = await db
				.select({ leaseId: lease.id })
				.from(lease)
				.where(and(eq(lease.tenantId, tenantId)));
			tenantLeaseIds = leaseRows.map((row) => row.leaseId);
			if (tenantLeaseIds.length === 0) {
				return {
					items: [],
					nextCursor: null,
				};
			}
		}

		const rows = await db
			.select({
				id: payment.id,
				leaseId: payment.leaseId,
				paymentType: payment.paymentType,
				paymentMethod: payment.paymentMethod,
				paymentDate: payment.paymentDate,
				paymentAmount: payment.paymentAmount,
				periodStart: payment.periodStart,
				periodEnd: payment.periodEnd,
				receiptNumber: payment.receiptNumber,
				description: payment.description,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				leaseStatus: lease.status,
				leaseStartDate: lease.startDate,
				unitName: unit.name,
				unitAddress: unit.address,
				tenantFirstName: tenant.firstName,
				tenantLastName: tenant.lastName,
				tenantPhoneNumber: tenant.phoneNumber,
			})
			.from(payment)
			.leftJoin(lease, eq(payment.leaseId, lease.id))
			.leftJoin(unit, eq(lease.unitId, unit.id))
			.leftJoin(tenant, eq(lease.tenantId, tenant.id))
			.where(
				and(
					leaseId ? eq(payment.leaseId, leaseId) : undefined,
					paymentType ? eq(payment.paymentType, paymentType) : undefined,
					cursor ? lt(payment.id, cursor) : undefined,
					role === "tenant" && tenantLeaseIds
						? inArray(payment.leaseId, tenantLeaseIds)
						: undefined,
				),
			)
			.orderBy(desc(payment.id))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = (hasMore ? rows.slice(0, limit) : rows).map(
			mapPaymentWithLeaseSummary,
		);

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
