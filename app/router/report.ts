import { implement } from "@orpc/server";
import {
	addDays,
	addMonths,
	endOfMonth,
	format,
	parseISO,
	startOfMonth,
} from "date-fns";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNotNull,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db/db";
import { user } from "@/db/schema/auth";
import { leaseDocument, unitDocument } from "@/db/schema/document";
import { inspection } from "@/db/schema/inspection";
import { lease, leaseRent } from "@/db/schema/lease";
import { payment } from "@/db/schema/payment";
import { repairRequest } from "@/db/schema/repair";
import { tenant } from "@/db/schema/tenant";
import { unit } from "@/db/schema/unit";
import { utility, utilityBill } from "@/db/schema/utility";
import { contract } from "../contract";
import {
	authMiddleware,
	type BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

// ── Helpers ──

/** Returns today's ISO date string (YYYY-MM-DD). */
function today(): string {
	return format(new Date(), "yyyy-MM-dd");
}

/** Returns the first and last day of the current calendar month as ISO strings. */
function currentMonthRange(): { from: string; to: string } {
	const now = new Date();
	const from = format(
		new Date(now.getFullYear(), now.getMonth(), 1),
		"yyyy-MM-dd",
	);
	const to = format(
		new Date(now.getFullYear(), now.getMonth() + 1, 0),
		"yyyy-MM-dd",
	);
	return { from, to };
}

/** Calculates the number of days between two ISO date strings. */
function daysBetween(a: string, b: string): number {
	return Math.round(
		(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
	);
}

function monthKey(dateValue: Date): string {
	return format(dateValue, "yyyy-MM");
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

// ── Handlers ──

export const occupancySummary = os.report.occupancySummary
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["read"] }))
	.handler(async ({ context }) => {
		const { organizationId } = context.user;

		const rows = await db
			.select({ status: unit.status, count: sql<number>`count(*)::int` })
			.from(unit)
			.where(eq(unit.organizationId, organizationId))
			.groupBy(unit.status);

		const counts = { occupied: 0, available: 0, maintenance: 0, inactive: 0 };
		for (const row of rows) {
			counts[row.status as keyof typeof counts] = row.count;
		}

		const total =
			counts.occupied + counts.available + counts.maintenance + counts.inactive;
		const activeUnits = total - counts.inactive;
		const occupancyRate =
			activeUnits > 0
				? Math.round((counts.occupied / activeUnits) * 100 * 10) / 10
				: 0;

		return { total, ...counts, occupancyRate };
	});

export const rentCollection = os.report.rentCollection
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const period =
			input?.from && input?.to
				? { from: input.from, to: input.to }
				: currentMonthRange();

		// Fetch all active/extended leases for this org
		const leaseRows = await db
			.select({
				id: lease.id,
				unitId: lease.unitId,
				tenantId: lease.tenantId,
			})
			.from(lease)
			.innerJoin(unit, eq(unit.id, lease.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					or(eq(lease.status, "active"), eq(lease.status, "extended")),
					input?.unitId ? eq(lease.unitId, input.unitId) : undefined,
				),
			);

		if (leaseRows.length === 0) {
			return {
				period,
				totalExpected: "0.00",
				totalCollected: "0.00",
				totalOutstanding: "0.00",
				rows: [],
			};
		}

		const leaseIds = leaseRows.map((l) => l.id);

		// Current rent per lease — most recent row with effectiveDate <= period.to
		const rentRows = await db
			.select({
				leaseId: leaseRent.leaseId,
				rentAmount: leaseRent.rentAmount,
			})
			.from(leaseRent)
			.where(
				and(
					inArray(leaseRent.leaseId, leaseIds),
					eq(leaseRent.status, "active"),
					lte(leaseRent.effectiveDate, period.to),
				),
			)
			.orderBy(desc(leaseRent.effectiveDate));

		// Keep only the most recent rent row per lease
		const currentRentByLease = new Map<number, number>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, Number(r.rentAmount));
			}
		}

		// Payments in the period (rent-type only)
		const paymentRows = await db
			.select({
				leaseId: payment.leaseId,
				paymentType: payment.paymentType,
				periodStart: payment.periodStart,
				paymentAmount: payment.paymentAmount,
			})
			.from(payment)
			.where(
				and(
					inArray(payment.leaseId, leaseIds),
					isNotNull(payment.periodStart),
					gte(payment.periodStart, period.from),
					lte(payment.periodStart, period.to),
					inArray(payment.paymentType, ["rent", "arrear", "rent_waiver"]),
				),
			);

		// Sum cash collections per lease and track waived rent separately.
		const collectedByLease = new Map<number, number>();
		const waivedByLease = new Map<number, number>();
		for (const p of paymentRows) {
			if (p.paymentType === "rent_waiver") {
				const prevWaived = waivedByLease.get(p.leaseId) ?? 0;
				waivedByLease.set(p.leaseId, prevWaived + Number(p.paymentAmount));
				continue;
			}

			const prevCollected = collectedByLease.get(p.leaseId) ?? 0;
			collectedByLease.set(p.leaseId, prevCollected + Number(p.paymentAmount));
		}

		// Unit and tenant names
		const unitRows = await db
			.select({ id: unit.id, name: unit.name })
			.from(unit)
			.where(
				inArray(
					unit.id,
					leaseRows.map((l) => l.unitId),
				),
			);

		const tenantRows = await db
			.select({
				id: tenant.id,
				firstName: tenant.firstName,
				lastName: tenant.lastName,
			})
			.from(tenant)
			.where(
				inArray(
					tenant.id,
					leaseRows.map((l) => l.tenantId),
				),
			);

		const unitNameById = new Map(unitRows.map((u) => [u.id, u.name]));
		const tenantNameById = new Map(
			tenantRows.map((t) => [
				t.id,
				[t.firstName, t.lastName].filter(Boolean).join(" "),
			]),
		);

		let totalExpected = 0;
		let totalCollected = 0;

		const rows = leaseRows.map((l) => {
			const rentDue = currentRentByLease.get(l.id) ?? 0;
			const collected = collectedByLease.get(l.id) ?? 0;
			const waived = waivedByLease.get(l.id) ?? 0;
			const outstanding = rentDue - collected - waived;

			totalExpected += rentDue;
			totalCollected += collected;

			return {
				leaseId: l.id,
				unitId: l.unitId,
				unitName: unitNameById.get(l.unitId) ?? "",
				tenantId: l.tenantId,
				tenantName: tenantNameById.get(l.tenantId) ?? "",
				rentDue: rentDue.toFixed(2),
				collected: collected.toFixed(2),
				outstanding: outstanding.toFixed(2),
			};
		});

		return {
			period,
			totalExpected: totalExpected.toFixed(2),
			totalCollected: totalCollected.toFixed(2),
			totalOutstanding: rows
				.reduce((sum, row) => sum + Number(row.outstanding), 0)
				.toFixed(2),
			rows,
		};
	});

export const paymentOverview = os.report.paymentOverview
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const { cursor, limit, from, to, unitId, paymentType, paymentMethod } =
			input;

		// Resolve all lease IDs that belong to this org,
		// optionally filtered to a specific unit.
		const leaseRows = await db
			.select({ id: lease.id, unitId: lease.unitId, tenantId: lease.tenantId })
			.from(lease)
			.innerJoin(unit, eq(unit.id, lease.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					unitId ? eq(lease.unitId, unitId) : undefined,
				),
			);

		if (leaseRows.length === 0) {
			return { items: [], nextCursor: null };
		}

		const leaseIds = leaseRows.map((l) => l.id);

		// Build a lookup map: leaseId → { unitId, tenantId }
		const leaseMetaById = new Map(
			leaseRows.map((l) => [l.id, { unitId: l.unitId, tenantId: l.tenantId }]),
		);

		// Fetch payments with filters applied
		const rows = await db
			.select({
				payment: payment,
			})
			.from(payment)
			.where(
				and(
					inArray(payment.leaseId, leaseIds),
					from ? gte(payment.paymentDate, from) : undefined,
					to ? lte(payment.paymentDate, to) : undefined,
					paymentType ? eq(payment.paymentType, paymentType) : undefined,
					paymentMethod ? eq(payment.paymentMethod, paymentMethod) : undefined,
					cursor ? gt(payment.id, cursor) : undefined,
				),
			)
			.orderBy(desc(payment.paymentDate), desc(payment.id))
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const pageRows = hasMore ? rows.slice(0, limit) : rows;

		if (pageRows.length === 0) {
			return { items: [], nextCursor: null };
		}

		// Resolve unit names
		const unitIds = [...new Set(leaseRows.map((l) => l.unitId))];
		const unitRows = await db
			.select({ id: unit.id, name: unit.name })
			.from(unit)
			.where(inArray(unit.id, unitIds));
		const unitNameById = new Map(unitRows.map((u) => [u.id, u.name]));

		// Resolve tenant names
		const tenantIds = [...new Set(leaseRows.map((l) => l.tenantId))];
		const tenantRows = await db
			.select({
				id: tenant.id,
				firstName: tenant.firstName,
				lastName: tenant.lastName,
			})
			.from(tenant)
			.where(inArray(tenant.id, tenantIds));
		const tenantNameById = new Map(
			tenantRows.map((t) => [
				t.id,
				[t.firstName, t.lastName].filter(Boolean).join(" "),
			]),
		);

		const items = pageRows.map(({ payment: p }) => {
			const meta = leaseMetaById.get(p.leaseId)!;
			return {
				paymentId: p.id,
				leaseId: p.leaseId,
				unitId: meta.unitId,
				unitName: unitNameById.get(meta.unitId) ?? "",
				tenantId: meta.tenantId,
				tenantName: tenantNameById.get(meta.tenantId) ?? "",
				paymentAmount: p.paymentAmount,
				paymentType: p.paymentType,
				paymentMethod: p.paymentMethod,
				paymentDate: p.paymentDate,
				receiptNumber: p.receiptNumber ?? null,
				description: p.description ?? null,
			};
		});

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].paymentId : null,
		};
	});

export const arrearsOverview = os.report.arrearsOverview
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ context }) => {
		const { organizationId } = context.user;

		const leaseRows = await db
			.select({
				id: lease.id,
				unitId: lease.unitId,
				tenantId: lease.tenantId,
				startDate: lease.startDate,
			})
			.from(lease)
			.innerJoin(unit, eq(unit.id, lease.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					or(eq(lease.status, "active"), eq(lease.status, "extended")),
				),
			);

		if (leaseRows.length === 0) {
			return {
				totalArrears: "0.00",
				tenantsInArrears: 0,
				tenantsInTotal: 0,
				rows: [],
			};
		}

		const leaseIds = leaseRows.map((l) => l.id);

		const todayDate = new Date();
		const endOfCurrentMonthStr = format(endOfMonth(todayDate), "yyyy-MM-dd");

		const rentRows = await db
			.select({
				leaseId: leaseRent.leaseId,
				rentAmount: leaseRent.rentAmount,
				agreedPaymentDay: leaseRent.agreedPaymentDay,
				effectiveDate: leaseRent.effectiveDate,
				id: leaseRent.id,
			})
			.from(leaseRent)
			.where(
				and(
					inArray(leaseRent.leaseId, leaseIds),
					eq(leaseRent.status, "active"),
					lte(leaseRent.effectiveDate, endOfCurrentMonthStr),
				),
			)
			.orderBy(
				asc(leaseRent.leaseId),
				asc(leaseRent.effectiveDate),
				asc(leaseRent.id),
			);

		const rentScheduleByLease = new Map<
			number,
			Array<{
				effectiveDate: string;
				rentAmount: number;
				agreedPaymentDay: number;
			}>
		>();

		for (const row of rentRows) {
			const list = rentScheduleByLease.get(row.leaseId) ?? [];
			list.push({
				effectiveDate: row.effectiveDate,
				rentAmount: Number(row.rentAmount),
				agreedPaymentDay: row.agreedPaymentDay,
			});
			rentScheduleByLease.set(row.leaseId, list);
		}

		const collectedRows = await db
			.select({
				leaseId: payment.leaseId,
				periodStart: payment.periodStart,
				paymentAmount: payment.paymentAmount,
			})
			.from(payment)
			.where(
				and(
					inArray(payment.leaseId, leaseIds),
					inArray(payment.paymentType, ["rent", "arrear", "rent_waiver"]),
					isNotNull(payment.periodStart),
					lte(payment.periodStart, endOfCurrentMonthStr),
				),
			);

		const collectedByLeasePeriod = new Map<string, number>();
		for (const row of collectedRows) {
			if (!row.periodStart) continue;
			const key = `${row.leaseId}:${monthKey(parseISO(row.periodStart))}`;
			const prev = collectedByLeasePeriod.get(key) ?? 0;
			collectedByLeasePeriod.set(key, prev + Number(row.paymentAmount));
		}

		const unitRows = await db
			.select({ id: unit.id, name: unit.name })
			.from(unit)
			.where(
				inArray(
					unit.id,
					leaseRows.map((l) => l.unitId),
				),
			);

		const tenantRows = await db
			.select({
				id: tenant.id,
				firstName: tenant.firstName,
				lastName: tenant.lastName,
				phoneNumber: tenant.phoneNumber,
			})
			.from(tenant)
			.where(
				inArray(
					tenant.id,
					leaseRows.map((l) => l.tenantId),
				),
			);

		const unitNameById = new Map(unitRows.map((u) => [u.id, u.name]));
		const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

		const arrearsRows = [];
		let totalArrears = 0;
		const currentMonthStart = startOfMonth(todayDate);

		for (const l of leaseRows) {
			const rentSchedule = rentScheduleByLease.get(l.id) ?? [];
			if (rentSchedule.length === 0) continue;

			const leaseStart = parseISO(l.startDate);
			const leaseAnchorDay = leaseStart.getDate();
			let cursor = startOfMonth(leaseStart);

			let expected = 0;
			let collected = 0;
			let monthsOverdue = 0;

			while (cursor.getTime() <= currentMonthStart.getTime()) {
				const cyclePeriod = resolveLeaseCyclePeriod(cursor, leaseAnchorDay);

				let cycleRent: { rentAmount: number; agreedPaymentDay: number } | null =
					null;
				for (const scheduleRow of rentSchedule) {
					if (scheduleRow.effectiveDate <= cyclePeriod.periodEnd) {
						cycleRent = {
							rentAmount: scheduleRow.rentAmount,
							agreedPaymentDay: scheduleRow.agreedPaymentDay,
						};
					}
				}

				if (!cycleRent) {
					cursor = startOfMonth(addMonths(cursor, 1));
					continue;
				}

				const dueDay = Math.min(
					cycleRent.agreedPaymentDay,
					endOfMonth(cursor).getDate(),
				);
				const dueDate = new Date(cursor);
				dueDate.setDate(dueDay);
				dueDate.setHours(23, 59, 59, 999);

				if (todayDate.getTime() <= dueDate.getTime()) {
					cursor = startOfMonth(addMonths(cursor, 1));
					continue;
				}

				expected += cycleRent.rentAmount;

				const periodKey = `${l.id}:${monthKey(cursor)}`;
				const cycleCollected = collectedByLeasePeriod.get(periodKey) ?? 0;
				collected += cycleCollected;

				if (cycleRent.rentAmount - cycleCollected > 0) {
					monthsOverdue += 1;
				}

				cursor = startOfMonth(addMonths(cursor, 1));
			}

			const arrears = expected - collected;

			if (arrears <= 0) continue;
			const t = tenantById.get(l.tenantId);

			totalArrears += arrears;
			arrearsRows.push({
				leaseId: l.id,
				unitId: l.unitId,
				unitName: unitNameById.get(l.unitId) ?? "",
				tenantId: l.tenantId,
				tenantName: t
					? [t.firstName, t.lastName].filter(Boolean).join(" ")
					: "",
				tenantPhone: t?.phoneNumber ?? "",
				currentBalance: arrears.toFixed(2),
				arrearsAmount: arrears.toFixed(2),
				monthsOverdue,
			});
		}

		return {
			totalArrears: totalArrears.toFixed(2),
			tenantsInArrears: arrearsRows.length,
			tenantsInTotal: leaseRows.length,
			rows: arrearsRows,
		};
	});

export const upcomingRentDue = os.report.upcomingRentDue
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const { daysAhead } = input;
		const todayStr = today();
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + daysAhead);
		const futureDateStr = format(futureDate, "yyyy-MM-dd");

		const leaseRows = await db
			.select({
				id: lease.id,
				unitId: lease.unitId,
				tenantId: lease.tenantId,
				startDate: lease.startDate,
			})
			.from(lease)
			.innerJoin(unit, eq(unit.id, lease.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					or(eq(lease.status, "active"), eq(lease.status, "extended")),
				),
			);

		const rentRows = await db
			.select({ leaseId: leaseRent.leaseId, rentAmount: leaseRent.rentAmount })
			.from(leaseRent)
			.where(
				and(
					inArray(
						leaseRent.leaseId,
						leaseRows.map((l) => l.id),
					),
					eq(leaseRent.status, "active"),
					lte(leaseRent.effectiveDate, todayStr),
				),
			)
			.orderBy(desc(leaseRent.effectiveDate));

		const currentRentByLease = new Map<number, number>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, Number(r.rentAmount));
			}
		}

		const unitRows = await db
			.select({ id: unit.id, name: unit.name })
			.from(unit)
			.where(
				inArray(
					unit.id,
					leaseRows.map((l) => l.unitId),
				),
			);

		const tenantRows = await db
			.select({
				id: tenant.id,
				firstName: tenant.firstName,
				lastName: tenant.lastName,
				phoneNumber: tenant.phoneNumber,
			})
			.from(tenant)
			.where(
				inArray(
					tenant.id,
					leaseRows.map((l) => l.tenantId),
				),
			);

		const unitNameById = new Map(unitRows.map((u) => [u.id, u.name]));
		const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

		const resultRows = [];
		const now = new Date();

		for (const l of leaseRows) {
			// Next monthly due date based on the start day-of-month
			const startDay = new Date(l.startDate).getDate();
			const dueDate = new Date(now.getFullYear(), now.getMonth(), startDay);

			// If this month's due date has already passed, advance to next month
			if (dueDate <= now) {
				dueDate.setMonth(dueDate.getMonth() + 1);
			}

			const dueDateStr = format(dueDate, "yyyy-MM-dd");
			if (dueDateStr > futureDateStr) continue;

			const daysUntilDue = daysBetween(todayStr, dueDateStr);
			const t = tenantById.get(l.tenantId);

			resultRows.push({
				leaseId: l.id,
				unitId: l.unitId,
				unitName: unitNameById.get(l.unitId) ?? "",
				tenantId: l.tenantId,
				tenantName: t
					? [t.firstName, t.lastName].filter(Boolean).join(" ")
					: "",
				tenantPhone: t?.phoneNumber ?? "",
				rentAmount: (currentRentByLease.get(l.id) ?? 0).toFixed(2),
				dueDate: dueDateStr,
				daysUntilDue,
			});
		}

		resultRows.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

		return { rows: resultRows };
	});

export const expiringDocuments = os.report.expiringDocuments
	.use(authMiddleware)
	.use(permissionMiddleware({ document: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const { daysAhead } = input;
		const todayStr = today();
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + daysAhead);
		const futureDateStr = format(futureDate, "yyyy-MM-dd");

		const rows: Array<{
			id: number;
			documentType: string;
			label: string;
			expiryDate: string;
			daysUntilExpiry: number;
			resourceType: "unit" | "tenant" | "lease";
			resourceId: number;
			resourceName: string;
		}> = [];

		// Unit documents with expiryDate in range
		const unitDocRows = await db
			.select({
				id: unitDocument.id,
				documentType: unitDocument.documentType,
				label: unitDocument.label,
				expiryDate: unitDocument.expiryDate,
				unitId: unitDocument.unitId,
				unitName: unit.name,
			})
			.from(unitDocument)
			.innerJoin(unit, eq(unit.id, unitDocument.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					eq(unitDocument.status, "active"),
					isNotNull(unitDocument.expiryDate),
					gte(unitDocument.expiryDate, todayStr),
					lte(unitDocument.expiryDate, futureDateStr),
				),
			);

		for (const d of unitDocRows) {
			rows.push({
				id: d.id,
				documentType: d.documentType,
				label: d.label,
				expiryDate: d.expiryDate!,
				daysUntilExpiry: daysBetween(todayStr, d.expiryDate!),
				resourceType: "unit",
				resourceId: d.unitId,
				resourceName: d.unitName,
			});
		}

		// Lease documents — using documentDate as the expiry proxy
		const leaseDocRows = await db
			.select({
				id: leaseDocument.id,
				documentType: leaseDocument.documentType,
				label: leaseDocument.label,
				documentDate: leaseDocument.documentDate,
				leaseId: leaseDocument.leaseId,
				unitId: lease.unitId,
				unitName: unit.name,
			})
			.from(leaseDocument)
			.innerJoin(lease, eq(lease.id, leaseDocument.leaseId))
			.innerJoin(unit, eq(unit.id, lease.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					eq(leaseDocument.status, "active"),
					isNotNull(leaseDocument.documentDate),
					gte(leaseDocument.documentDate, todayStr),
					lte(leaseDocument.documentDate, futureDateStr),
				),
			);

		for (const d of leaseDocRows) {
			rows.push({
				id: d.id,
				documentType: d.documentType,
				label: d.label,
				expiryDate: d.documentDate!,
				daysUntilExpiry: daysBetween(todayStr, d.documentDate!),
				resourceType: "lease",
				resourceId: d.leaseId,
				resourceName: d.unitName,
			});
		}

		rows.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

		return { rows };
	});

export const upcomingInspections = os.report.upcomingInspections
	.use(authMiddleware)
	.use(permissionMiddleware({ inspection: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const { daysAhead, unitId, status } = input;
		const todayStr = today();
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + daysAhead);
		const futureDateStr = format(futureDate, "yyyy-MM-dd");

		const rows = await db
			.select({
				id: inspection.id,
				title: inspection.title,
				unitId: inspection.unitId,
				unitName: unit.name,
				scheduledDate: inspection.scheduledDate,
				userId: inspection.userId,
				userName: user.name,
			})
			.from(inspection)
			.innerJoin(unit, eq(unit.id, inspection.unitId))
			.innerJoin(user, eq(user.id, inspection.userId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					status
						? eq(inspection.status, status)
						: or(
								eq(inspection.status, "scheduled"),
								eq(inspection.status, "rescheduled"),
							),
					gte(inspection.scheduledDate, todayStr),
					lte(inspection.scheduledDate, futureDateStr),
					unitId ? eq(inspection.unitId, unitId) : undefined,
				),
			)
			.orderBy(asc(inspection.scheduledDate));

		return {
			rows: rows.map((r) => ({
				id: r.id,
				title: r.title,
				unitId: r.unitId,
				unitName: r.unitName,
				scheduledDate: r.scheduledDate,
				daysUntilInspection: daysBetween(todayStr, r.scheduledDate),
				assignedUserName: r.userName ?? null,
			})),
		};
	});

export const overdueUtilityBills = os.report.overdueUtilityBills
	.use(authMiddleware)
	.use(permissionMiddleware({ utility: ["read"] }))
	.handler(async ({ context }) => {
		const { organizationId } = context.user;

		const todayStr = today();

		const rows = await db
			.select({
				billId: utilityBill.id,
				utilityId: utilityBill.utilityId,
				utilityType: utility.utilityType,
				unitId: utility.unitId,
				unitName: unit.name,
				billAmount: utilityBill.billAmount,
				previousDueAmount: utilityBill.previousDueAmount,
				periodEnd: utilityBill.periodEnd,
				status: utilityBill.status,
			})
			.from(utilityBill)
			.innerJoin(utility, eq(utility.id, utilityBill.utilityId))
			.innerJoin(unit, eq(unit.id, utility.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					or(
						eq(utilityBill.status, "overdue"),
						eq(utilityBill.status, "warned"),
					),
				),
			)
			.orderBy(asc(utilityBill.periodEnd));

		let totalOverdue = 0;
		const resultRows = rows.map((r) => {
			const daysPastDue = daysBetween(r.periodEnd, todayStr);
			totalOverdue += Number(r.billAmount);
			return {
				billId: r.billId,
				utilityId: r.utilityId,
				utilityType: r.utilityType,
				unitId: r.unitId,
				unitName: r.unitName,
				billAmount: r.billAmount,
				previousDueAmount: r.previousDueAmount,
				periodEnd: r.periodEnd,
				daysPastDue,
				status: r.status,
			};
		});

		return {
			totalOverdue: totalOverdue.toFixed(2),
			rows: resultRows,
		};
	});

export const repairSummary = os.report.repairSummary
	.use(authMiddleware)
	.use(permissionMiddleware({ repair: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const rows = await db
			.select({
				status: repairRequest.status,
				priority: repairRequest.priority,
				repairType: repairRequest.repairType,
				count: sql<number>`count(*)::int`,
			})
			.from(repairRequest)
			.innerJoin(unit, eq(unit.id, repairRequest.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					input.unitId ? eq(repairRequest.unitId, input.unitId) : undefined,
				),
			)
			.groupBy(
				repairRequest.status,
				repairRequest.priority,
				repairRequest.repairType,
			);

		const statusCounts = { open: 0, in_progress: 0, resolved: 0, cancelled: 0 };
		const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
		const typeCounts = { plumbing: 0, electrical: 0, structural: 0, other: 0 };

		for (const r of rows) {
			statusCounts[r.status as keyof typeof statusCounts] += r.count;
			priorityCounts[r.priority as keyof typeof priorityCounts] += r.count;
			typeCounts[r.repairType as keyof typeof typeCounts] += r.count;
		}

		return {
			open: statusCounts.open,
			inProgress: statusCounts.in_progress,
			resolved: statusCounts.resolved,
			cancelled: statusCounts.cancelled,
			byPriority: priorityCounts,
			byType: typeCounts,
		};
	});

export const expiringLeases = os.report.expiringLeases
	.use(authMiddleware)
	.use(permissionMiddleware({ lease: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;

		const { daysAhead } = input;
		const todayStr = today();
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + daysAhead);
		const futureDateStr = format(futureDate, "yyyy-MM-dd");

		const leaseRows = await db
			.select({
				id: lease.id,
				unitId: lease.unitId,
				unitName: unit.name,
				tenantId: lease.tenantId,
				endDate: lease.endDate,
				status: lease.status,
			})
			.from(lease)
			.innerJoin(unit, eq(unit.id, lease.unitId))
			.where(
				and(
					eq(unit.organizationId, organizationId),
					or(eq(lease.status, "active"), eq(lease.status, "extended")),
					isNotNull(lease.endDate),
					gte(lease.endDate, todayStr),
					lte(lease.endDate, futureDateStr),
				),
			)
			.orderBy(asc(lease.endDate));

		if (leaseRows.length === 0) return { rows: [] };

		const tenantRows = await db
			.select({
				id: tenant.id,
				firstName: tenant.firstName,
				lastName: tenant.lastName,
				phoneNumber: tenant.phoneNumber,
			})
			.from(tenant)
			.where(
				inArray(
					tenant.id,
					leaseRows.map((l) => l.tenantId),
				),
			);

		const tenantById = new Map(tenantRows.map((t) => [t.id, t]));

		return {
			rows: leaseRows.map((l) => {
				const t = tenantById.get(l.tenantId);
				return {
					leaseId: l.id,
					unitId: l.unitId,
					unitName: l.unitName,
					tenantId: l.tenantId,
					tenantName: t
						? [t.firstName, t.lastName].filter(Boolean).join(" ")
						: "",
					tenantPhone: t?.phoneNumber ?? "",
					endDate: l.endDate!,
					daysUntilExpiry: daysBetween(todayStr, l.endDate!),
					status: l.status,
				};
			}),
		};
	});
