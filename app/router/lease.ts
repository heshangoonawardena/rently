import { implement } from "@orpc/server";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	ilike,
	inArray,
	isNotNull,
	ne,
} from "drizzle-orm";
import { db } from "@/db/db";
import {
	lease,
	leaseRent,
	leaseSettlement,
	leaseSettlementExpense,
} from "@/db/schema/lease";
import { payment } from "@/db/schema/payment";
import { tenant } from "@/db/schema/tenant";
import { unit } from "@/db/schema/unit";
import { generateNextReceiptNumber } from "@/lib/receipt-number";
import { contract } from "../contract";
import {
	authMiddleware,
	type BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

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

function toDateOnly(dateValue: string): string {
	return dateValue.slice(0, 10);
}

// ── Lease handlers ──

export const createLease = os.lease.create
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["create"] }))
	.handler(async ({ input, errors, context }) => {
		const { rentAmount, agreedPaymentDay, ...leaseData } = input;
		const { organizationId } = context.user;

		// Check the unit exists and belongs to this org.
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
				message: `Unit is currently '${targetUnit.status}' — only 'available' units can be leased`,
			});
		}

		const { newLease, currentRent } = await db.transaction(async (tx) => {
			const [newLease] = await tx.insert(lease).values(leaseData).returning();

			const [currentRent] = await tx
				.insert(leaseRent)
				.values({
					leaseId: newLease.id,
					rentAmount,
					agreedPaymentDay,
					effectiveDate: leaseData.startDate,
				})
				.returning();

			const receiptNumber = await generateReceiptNumber();

			await tx.insert(payment).values({
				leaseId: newLease.id,
				paymentType: "deposit",
				paymentMethod: "cash",
				paymentDate: toDateOnly(leaseData.startDate),
				paymentAmount: leaseData.depositAmount,
				periodStart: null,
				periodEnd: null,
				receiptNumber,
				description: "Initial lease deposit",
			});

			await tx
				.update(unit)
				.set({ status: "occupied" })
				.where(eq(unit.id, leaseData.unitId));

			await tx
				.update(tenant)
				.set({ status: "active" })
				.where(eq(tenant.id, leaseData.tenantId));

			return { newLease, currentRent };
		});

		// Fetch updated related records
		const [updatedUnit, updatedTenant] = await Promise.all([
			db
				.select()
				.from(unit)
				.where(eq(unit.id, newLease.unitId))
				.limit(1)
				.then((rows) => rows[0]),
			db
				.select()
				.from(tenant)
				.where(eq(tenant.id, newLease.tenantId))
				.limit(1)
				.then((rows) => rows[0]),
		]);

		return {
			...newLease,
			unit: updatedUnit,
			tenant: updatedTenant,
			currentRent,
		};
	});

export const updateLease = os.lease.update
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["update"] }))
	.handler(async ({ input, errors }) => {
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

		const [updatedLease] = await db
			.update(lease)
			.set(updates)
			.where(eq(lease.id, id))
			.returning();

		const [[updatedUnit], [updatedTenant], [currentRent]] = await Promise.all([
			db.select().from(unit).where(eq(unit.id, updatedLease.unitId)).limit(1),

			db
				.select()
				.from(tenant)
				.where(eq(tenant.id, updatedLease.tenantId))
				.limit(1),

			db
				.select()
				.from(leaseRent)
				.where(
					and(
						eq(leaseRent.leaseId, updatedLease.id),
						eq(leaseRent.status, "active"),
					),
				)
				.orderBy(desc(leaseRent.effectiveDate))
				.limit(1),
		]);

		return {
			...updatedLease,
			unit: updatedUnit,
			tenant: updatedTenant,
			currentRent: currentRent ?? null,
		};
	});

export const renewLease = os.lease.renew
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["update"] }))
	.handler(async ({ input, errors }) => {
		const { id, newEndDate, rentAmount, effectiveDate, agreedPaymentDay } =
			input;

		const [existing] = await db
			.select({
				id: lease.id,
				status: lease.status,
				unitId: lease.unitId,
				tenantId: lease.tenantId,
				startDate: lease.startDate,
				endDate: lease.endDate,
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
				message: `Lease has status '${existing.status}' — only 'active' or 'extended' leases can be renewed`,
			});
		}

		if (newEndDate && existing.endDate && newEndDate <= existing.endDate) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "RENEWAL_DATE_NOT_AFTER_CURRENT_END" },
				message: `newEndDate (${newEndDate}) must be after the current end date (${existing.endDate})`,
			});
		}

		const [updatedLease] = await db
			.update(lease)
			.set({
				status: "extended",
				endDate: newEndDate,
			})
			.where(eq(lease.id, id))
			.returning();

		const [currentRent] = await db
			.insert(leaseRent)
			.values({
				leaseId: id,
				rentAmount,
				agreedPaymentDay,
				effectiveDate: effectiveDate ?? newEndDate ?? existing.startDate,
				description: `Rent revised on lease renewal (effective ${effectiveDate})`,
			})
			.returning();

		const [[updatedUnit], [updatedTenant]] = await Promise.all([
			db.select().from(unit).where(eq(unit.id, updatedLease.unitId)).limit(1),

			db
				.select()
				.from(tenant)
				.where(eq(tenant.id, updatedLease.tenantId))
				.limit(1),
		]);

		return {
			...updatedLease,
			unit: updatedUnit,
			tenant: updatedTenant,
			currentRent,
		};
	});

export const deleteLease = os.lease.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["delete"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, endDate } = input;
		const terminationDate = toDateOnly(endDate);

		const [existing] = await db
			.select({
				id: lease.id,
				unitId: lease.unitId,
				tenantId: lease.tenantId,
				status: lease.status,
				depositAmount: lease.depositAmount,
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
				data: { rule: "LEASE_NOT_TERMINABLE" },
				message: `Lease has status '${existing.status}' — only 'active' or 'extended' leases can be terminated`,
			});
		}

		const [existingSettlement] = await db
			.select({ id: leaseSettlement.id })
			.from(leaseSettlement)
			.where(eq(leaseSettlement.leaseId, id))
			.limit(1);

		if (existingSettlement) {
			throw errors.CONFLICT({
				data: { field: "leaseId", value: String(id) },
				message: "This lease already has a settlement",
			});
		}

		const expenses = input.expenses ?? [];
		const totalDeductions = Number(
			expenses.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
		);
		const depositAtTermination = Number(existing.depositAmount);
		const refundAmount = Number(
			Math.max(depositAtTermination - totalDeductions, 0).toFixed(2),
		);
		const outstandingAmount = Number(
			Math.max(totalDeductions - depositAtTermination, 0).toFixed(2),
		);

		const { updatedLease, settlementWithExpenses } = await db.transaction(
			async (tx) => {
				const [nextLease] = await tx
					.update(lease)
					.set({
						status: "terminated",
						endDate: terminationDate,
					})
					.where(eq(lease.id, id))
					.returning();

				await tx
					.update(unit)
					.set({ status: "available" })
					.where(eq(unit.id, existing.unitId));

				const [otherActiveLease] = await tx
					.select({ id: lease.id })
					.from(lease)
					.where(
						and(
							eq(lease.tenantId, existing.tenantId),
							inArray(lease.status, ["active", "extended"]),
							ne(lease.id, id),
						),
					)
					.limit(1);

				if (!otherActiveLease) {
					await tx
						.update(tenant)
						.set({ status: "inactive" })
						.where(eq(tenant.id, existing.tenantId));
				}

				const [newSettlement] = await tx
					.insert(leaseSettlement)
					.values({
						leaseId: id,
						createdBy: context.user.userId,
						terminationDate,
						depositAtTermination,
						totalDeductions,
						refundAmount,
						outstandingAmount,
						notes: input.notes ?? null,
					})
					.returning();

				const insertedExpenses =
					expenses.length > 0
						? await tx
								.insert(leaseSettlementExpense)
								.values(
									expenses.map((expense) => ({
										settlementId: newSettlement.id,
										label: expense.label,
										category: expense.category ?? null,
										amount: expense.amount,
										notes: expense.notes ?? null,
									})),
								)
								.returning()
						: [];

				const receiptNumber =
					expenses.length > 0 || refundAmount > 0
						? await generateReceiptNumber()
						: null;

				if (expenses.length > 0 && receiptNumber) {
					await tx.insert(payment).values(
						expenses.map((expense) => ({
							leaseId: id,
							paymentType: "deposit_deduction" as const,
							paymentMethod: "other" as const,
							paymentDate: terminationDate,
							paymentAmount: expense.amount,
							periodStart: null,
							periodEnd: null,
							receiptNumber,
							description: [
								"Lease settlement deduction",
								expense.category ? `(${expense.category})` : null,
								expense.label,
							]
								.filter(Boolean)
								.join(" - "),
						})),
					);
				}

				if (refundAmount > 0 && receiptNumber) {
					await tx.insert(payment).values({
						leaseId: id,
						paymentType: "refund" as const,
						paymentMethod: "other" as const,
						paymentDate: terminationDate,
						paymentAmount: refundAmount,
						periodStart: null,
						periodEnd: null,
						receiptNumber,
						description: "Refund to tenant from the lease deposit",
					});
				}

				return {
					updatedLease: nextLease,
					settlementWithExpenses: {
						...newSettlement,
						expenses: insertedExpenses,
					},
				};
			},
		);

		const [[updatedUnit], [updatedTenant], [currentRent]] = await Promise.all([
			db.select().from(unit).where(eq(unit.id, existing.unitId)).limit(1),

			db.select().from(tenant).where(eq(tenant.id, existing.tenantId)).limit(1),

			db
				.select()
				.from(leaseRent)
				.where(and(eq(leaseRent.leaseId, id), eq(leaseRent.status, "active")))
				.orderBy(desc(leaseRent.effectiveDate))
				.limit(1),
		]);

		return {
			...updatedLease,
			unit: updatedUnit,
			tenant: updatedTenant,
			currentRent: currentRent ?? null,
			settlement: settlementWithExpenses,
		};
	});

export const getLease = os.lease.get
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { role, userId } = context.user;

		// Tenants can only read their own lease
		let scopedTenantId: number | undefined;
		if (role === "tenant") {
			const [self] = await db
				.select({ id: tenant.id })
				.from(tenant)
				.where(eq(tenant.userId, userId))
				.limit(1);
			if (!self) throw errors.FORBIDDEN();
			scopedTenantId = self.id;
		}

		const [leaseRow] = await db
			.select()
			.from(lease)
			.where(
				and(
					eq(lease.id, input.id),
					scopedTenantId ? eq(lease.tenantId, scopedTenantId) : undefined,
				),
			)
			.limit(1);

		if (!leaseRow) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Lease",
					resourceId: input.id,
				},
				cause: "LEASE_NOT_FOUND",
			});
		}

		const [[unitRow], [tenantRow], [currentRent], [settlementRow]] =
			await Promise.all([
				db.select().from(unit).where(eq(unit.id, leaseRow.unitId)).limit(1),

				db
					.select()
					.from(tenant)
					.where(eq(tenant.id, leaseRow.tenantId))
					.limit(1),

				db
					.select()
					.from(leaseRent)
					.where(
						and(
							eq(leaseRent.leaseId, leaseRow.id),
							eq(leaseRent.status, "active"),
						),
					)
					.orderBy(desc(leaseRent.effectiveDate))
					.limit(1),

				db
					.select()
					.from(leaseSettlement)
					.where(eq(leaseSettlement.leaseId, leaseRow.id))
					.limit(1),
			]);

		const settlementExpenses = settlementRow
			? await db
					.select()
					.from(leaseSettlementExpense)
					.where(eq(leaseSettlementExpense.settlementId, settlementRow.id))
					.orderBy(asc(leaseSettlementExpense.id))
			: [];

		return {
			...leaseRow,
			unit: unitRow,
			tenant: tenantRow,
			currentRent: currentRent ?? null,
			settlement: settlementRow
				? {
						...settlementRow,
						expenses: settlementExpenses,
					}
				: null,
		};
	});

export const listLease = os.lease.list
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input, errors, context }) => {
		const { cursor, limit, status, unitId, tenantId } = input;
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
			.from(lease)
			.where(
				and(
					status ? eq(lease.status, status) : undefined,
					unitId ? eq(lease.unitId, unitId) : undefined,
					scopedTenantId ? eq(lease.tenantId, scopedTenantId) : undefined,
					cursor ? gt(lease.id, cursor) : undefined,
				),
			)
			.orderBy(asc(lease.status), desc(lease.startDate), desc(lease.updatedAt))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const leaseRows = hasMore ? rows.slice(0, limit) : rows;

		if (leaseRows.length === 0) {
			return { items: [], nextCursor: null };
		}

		const unitIds = [...new Set(leaseRows.map((l) => l.unitId))];
		const leaseIds = leaseRows.map((l) => l.id);

		// Fetch units and all active rent rows in parallel
		const [unitRows, rentRows, tenantRows] = await Promise.all([
			db.select().from(unit).where(inArray(unit.id, unitIds)),
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
			db
				.select()
				.from(tenant)
				.where(
					inArray(tenant.id, [...new Set(leaseRows.map((l) => l.tenantId))]),
				),
		]);

		const unitById = new Map(unitRows.map((u) => [u.id, u]));
		const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

		const currentRentByLease = new Map<number, (typeof rentRows)[number]>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, r);
			}
		}

		const items = leaseRows.map((l) => ({
			...l,
			unit: unitById.get(l.unitId)!,
			tenant: tenantById.get(l.tenantId)!,
			currentRent: currentRentByLease.get(l.id) ?? null,
		}));

		return {
			items,
			nextCursor: hasMore ? leaseRows[leaseRows.length - 1].id : null,
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

		if (parentLease.status !== "active" && parentLease.status !== "extended") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "LEASE_NOT_ACTIVE" },
				message:
					"Rent revisions can only be added to active or extended leases",
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
