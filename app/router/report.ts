import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { unit } from "@/db/schema/unit";
import { lease, leaseRent } from "@/db/schema/lease";
import { tenant } from "@/db/schema/tenant";
import { payment } from "@/db/schema/payment";
import {
	unitDocument,
	tenantDocument,
	leaseDocument,
} from "@/db/schema/document";
import { inspection } from "@/db/schema/inspection";
import { utility, utilityBill } from "@/db/schema/utility";
import { repairRequest } from "@/db/schema/repair";
import { user } from "@/db/schema/auth";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNotNull,
	lt,
	lte,
	ne,
	or,
	sql,
	sum,
} from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

// ── Helpers ──

/** Converts a Date object to ISO date string (YYYY-MM-DD). */
function dateToIsoString(date: Date): string {
	return date.toISOString().split("T")[0];
}

/** Returns the first and last day of the current calendar month as ISO strings. */
function currentMonthRange(): { from: string; to: string } {
	const now = new Date();
	const from = new Date(now.getFullYear(), now.getMonth(), 1)
		.toISOString()
		.split("T")[0];
	const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
		.toISOString()
		.split("T")[0];
	return { from, to };
}

/** Returns the first and last day of the current calendar month as Date objects. */
function currentMonthRangeAsDate(): { from: Date; to: Date } {
	const now = new Date();
	const from = new Date(now.getFullYear(), now.getMonth(), 1);
	const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return { from, to };
}

/** Returns today's ISO date string. */
function today(): string {
	return new Date().toISOString().split("T")[0];
}

/** Calculates the number of days between two ISO date strings. */
function daysBetween(a: string, b: string): number {
	return Math.round(
		(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
	);
}

// Blocks tenant-role callers — all report endpoints are owner/manager only.
const reportsAuthMiddleware = os
	.$context<BaseContext>()
	.middleware(async ({ context, next, errors }) => {
		// authMiddleware has already run, context.user is populated
		if ((context as any).user?.role === "tenant") {
			throw errors.FORBIDDEN();
		}
		return next({ context });
	});

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
			input.from && input.to
				? {
						from: input.from,
						to: input.to,
					}
				: currentMonthRangeAsDate();

		// Convert Date objects to ISO strings for database queries
		const periodFrom = dateToIsoString(period.from);
		const periodTo = dateToIsoString(period.to);

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
					input.unitId ? eq(lease.unitId, input.unitId) : undefined,
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

		// Current rent per lease (most recent row where effectiveDate <= period.to)
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
					lte(leaseRent.effectiveDate, periodTo),
				),
			)
			.orderBy(desc(leaseRent.effectiveDate));

		// Keep only the most recent rent row per lease
		const currentRentByLease = new Map<number, string>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, r.rentAmount);
			}
		}

		// Payments made in the period
		const paymentRows = await db
			.select({
				leaseId: payment.leaseId,
				paymentAmount: payment.paymentAmount,
				paymentType: payment.paymentType,
			})
			.from(payment)
			.where(
				and(
					inArray(payment.leaseId, leaseIds),
					gte(payment.paymentDate, periodFrom),
					lte(payment.paymentDate, periodTo),
					inArray(payment.paymentType, ["rent", "partial_rent", "arrear"]),
				),
			);

		// Sum payments per lease
		const collectedByLease = new Map<number, number>();
		for (const p of paymentRows) {
			const prev = collectedByLease.get(p.leaseId) ?? 0;
			collectedByLease.set(p.leaseId, prev + parseFloat(p.paymentAmount));
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
			const rentDue = parseFloat(currentRentByLease.get(l.id) ?? "0");
			const collected = collectedByLease.get(l.id) ?? 0;
			const outstanding = rentDue - collected;

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
			totalOutstanding: (totalExpected - totalCollected).toFixed(2),
			rows,
		};
	});

export const arrearsOverview = os.report.arrearsOverview
	.use(authMiddleware)
	.use(permissionMiddleware({ payment: ["read"] }))
	.handler(async ({ context }) => {
		const { organizationId } = context.user;

		// Find all active leases with a negative running balance
		// (balance is stored on the most recent payment row)
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
				),
			);

		if (leaseRows.length === 0) {
			return { totalArrears: "0.00", tenantsInArrears: 0, rows: [] };
		}

		const leaseIds = leaseRows.map((l) => l.id);

		// Latest payment (and its balanceAfter) per lease
		const latestPayments = await db
			.selectDistinctOn([payment.leaseId], {
				leaseId: payment.leaseId,
				balanceAfter: payment.balanceAfter,
				paymentDate: payment.paymentDate,
			})
			.from(payment)
			.where(inArray(payment.leaseId, leaseIds))
			.orderBy(payment.leaseId, desc(payment.paymentDate));

		const balanceByLease = new Map(
			latestPayments.map((p) => [p.leaseId, parseFloat(p.balanceAfter)]),
		);

		// Current rent per lease (for estimating months overdue)
		const rentRows = await db
			.select({ leaseId: leaseRent.leaseId, rentAmount: leaseRent.rentAmount })
			.from(leaseRent)
			.where(
				and(
					inArray(leaseRent.leaseId, leaseIds),
					eq(leaseRent.status, "active"),
					lte(leaseRent.effectiveDate, today()),
				),
			)
			.orderBy(desc(leaseRent.effectiveDate));

		const currentRentByLease = new Map<number, number>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, parseFloat(r.rentAmount));
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

		const arrearsRows = [];
		let totalArrears = 0;

		for (const l of leaseRows) {
			const balance = balanceByLease.get(l.id) ?? 0;
			if (balance >= 0) continue; // not in arrears

			const arrears = Math.abs(balance);
			const rent = currentRentByLease.get(l.id) ?? 1;
			const monthsOverdue = Math.floor(arrears / rent);
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
				currentBalance: balance.toFixed(2),
				arrearsAmount: arrears.toFixed(2),
				monthsOverdue,
			});
		}

		return {
			totalArrears: totalArrears.toFixed(2),
			tenantsInArrears: arrearsRows.length,
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
		const futureDateStr = futureDate.toISOString().split("T")[0];

		// Leases whose endDate (or next monthly cycle) falls in range.
		// For simplicity: active leases where the monthly anniversary of
		// startDate falls within the window.
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

		const currentRentByLease = new Map<number, string>();
		for (const r of rentRows) {
			if (!currentRentByLease.has(r.leaseId)) {
				currentRentByLease.set(r.leaseId, r.rentAmount);
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
			// Calculate the next due date based on the startDate day-of-month
			const startDay = new Date(l.startDate).getDate();
			const dueDate = new Date(now.getFullYear(), now.getMonth(), startDay);

			// If this month's due date has passed, look to next month
			if (dueDate < now) {
				dueDate.setMonth(dueDate.getMonth() + 1);
			}

			const dueDateStr = dateToIsoString(dueDate);
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
				rentAmount: currentRentByLease.get(l.id) ?? "0.00",
				dueDate,
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
		const futureDateStr = dateToIsoString(futureDate);

		const rows: Array<{
			id: number;
			documentType: string;
			label: string;
			expiryDate: Date;
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
				expiryDate: new Date(d.expiryDate!),
				daysUntilExpiry: daysBetween(todayStr, d.expiryDate!),
				resourceType: "unit",
				resourceId: d.unitId,
				resourceName: d.unitName,
			});
		}

		// Tenant documents — they don't have expiryDate in the schema,
		// but checking active status so we only return relevant ones.
		// If you add expiryDate to tenantDocument later, extend this query.

		// Lease documents with expiryDate (if documentDate is used as expiry proxy)
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
				expiryDate: new Date(d.documentDate!),
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
		const { daysAhead, unitId } = input;

		const todayStr = today();
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + daysAhead);
		const futureDateStr = dateToIsoString(futureDate);

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
					eq(inspection.status, "scheduled"),
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
				scheduledDate: new Date(r.scheduledDate),
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
			totalOverdue += parseFloat(r.billAmount);
			return {
				billId: r.billId,
				utilityId: r.utilityId,
				utilityType: r.utilityType,
				unitId: r.unitId,
				unitName: r.unitName,
				billAmount: r.billAmount,
				previousDueAmount: r.previousDueAmount,
				periodEnd: new Date(r.periodEnd),
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
		const futureDateStr = dateToIsoString(futureDate);

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
					endDate: new Date(l.endDate!),
					daysUntilExpiry: daysBetween(todayStr, l.endDate!),
					status: l.status,
				};
			}),
		};
	});
