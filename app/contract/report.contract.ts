import { oc } from "@orpc/contract";
import z from "zod";
import {
    arrearsOverviewOutput,
    expiringDocumentsInput,
    expiringDocumentsOutput,
    expiringLeasesInput,
    expiringLeasesOutput,
    occupancySummaryOutput,
    overdueUtilityBillsOutput,
    paymentOverviewInput,
    paymentOverviewOutput,
    rentCollectionInput,
    rentCollectionOutput,
    repairSummaryInput,
    repairSummaryOutput,
    upcomingInspectionsInput,
    upcomingInspectionsOutput,
    upcomingRentDueInput,
    upcomingRentDueOutput
} from "../schemas/report.schema";

export const base = oc.errors({
	UNAUTHORIZED: {
		status: 401,
		message: "Authentication required",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have permission to perform this action",
	},
});

// ── Report contracts ──
// All report endpoints are GET (read-only, no side effects).
// All are scoped to the caller's active organization.
// Tenant-role callers are blocked server-side — reports are owner/manager only.

export const occupancySummaryContract = base
	.route({
		method: "GET",
		path: "/reports/occupancy",
		summary: "Occupancy summary",
		description:
			"Returns a breakdown of units by status (occupied, available, maintenance, inactive) " +
			"and the overall occupancy rate for the active organization.",
		tags: ["Reports"],
	})
	.output(occupancySummaryOutput);

export const rentCollectionContract = base
	.route({
		method: "GET",
		path: "/reports/rent-collection",
		summary: "Rent collection report",
		description:
			"Shows expected vs collected rent per active lease for a given period. " +
			"Defaults to the current calendar month. Filter by unitId to drill into a single unit.",
		tags: ["Reports"],
	})
	.input(rentCollectionInput)
	.output(rentCollectionOutput);

export const paymentOverviewContract = base
	.route({
		method: "GET",
		path: "/reports/payments",
		summary: "Payment activity report",
		description:
			"Returns a cursor-paginated list of payments across all leases in the active organization. " +
			"Includes unit name, tenant name, and receipt number. " +
			"Default limit is 5 — use as-is for the dashboard widget. " +
			"Add filters (date range, unitId, paymentType, paymentMethod) and increase limit for the full breakdown view. " +
			"Tenant-role callers are blocked; use the lease payments endpoint instead.",
		tags: ["Reports"],
	})
	.input(paymentOverviewInput)
	.output(paymentOverviewOutput);

export const arrearsOverviewContract = base
	.route({
		method: "GET",
		path: "/reports/arrears",
		summary: "Arrears overview",
		description:
			"Lists all active leases where the running balance is negative (tenant owes money). " +
			"Includes tenant contact details and approximate months overdue.",
		tags: ["Reports"],
	})
	.output(arrearsOverviewOutput);

export const upcomingRentDueContract = base
	.route({
		method: "GET",
		path: "/reports/rent-due",
		summary: "Upcoming rent due",
		description:
			"Lists leases where rent will be due within the next N days (default 30). " +
			"Useful for proactive collection and reminder workflows.",
		tags: ["Reports"],
	})
	.input(upcomingRentDueInput)
	.output(upcomingRentDueOutput);

export const expiringDocumentsContract = base
	.route({
		method: "GET",
		path: "/reports/expiring-documents",
		summary: "Expiring documents",
		description:
			"Lists unit, tenant, and lease documents that expire within the next N days (default 30). " +
			"Covers all resource types in a single response.",
		tags: ["Reports"],
	})
	.input(expiringDocumentsInput)
	.output(expiringDocumentsOutput);

export const upcomingInspectionsContract = base
	.route({
		method: "GET",
		path: "/reports/upcoming-inspections",
		summary: "Upcoming inspections",
		description:
			"Lists scheduled inspections due within the next N days (default 30). " +
			"Filter by unitId to narrow to a specific unit.",
		tags: ["Reports"],
	})
	.input(upcomingInspectionsInput)
	.output(upcomingInspectionsOutput);

export const overdueUtilityBillsContract = base
	.route({
		method: "GET",
		path: "/reports/overdue-utility-bills",
		summary: "Overdue utility bills",
		description:
			"Lists utility bills in 'overdue' or 'warned' status across all units, " +
			"ordered by days past due descending.",
		tags: ["Reports"],
	})
	.input(z.object({}))
	.output(overdueUtilityBillsOutput);

export const repairSummaryContract = base
	.route({
		method: "GET",
		path: "/reports/repairs",
		summary: "Repair request summary",
		description:
			"Returns counts of repair requests grouped by status, priority, and repair type. " +
			"Filter by unitId to drill into a single unit.",
		tags: ["Reports"],
	})
	.input(repairSummaryInput)
	.output(repairSummaryOutput);

export const expiringLeasesContract = base
	.route({
		method: "GET",
		path: "/reports/expiring-leases",
		summary: "Expiring leases",
		description:
			"Lists active or extended leases that expire within the next N days (default 60). " +
			"Use this to trigger renewal conversations before leases lapse.",
		tags: ["Reports"],
	})
	.input(expiringLeasesInput)
	.output(expiringLeasesOutput);
