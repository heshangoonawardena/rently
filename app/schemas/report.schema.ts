import { paymentMethodEnum, paymentTypeEnum } from "@/db/schema/enums";
import z from "zod";

// ── Shared primitives ──

// Used by any endpoint that accepts a date-range filter
export const dateRangeInput = z.object({
	from: z.iso.date("from must be a valid ISO date (YYYY-MM-DD)").optional(),
	to: z.iso.date("to must be a valid ISO date (YYYY-MM-DD)").optional(),
});

// ── Occupancy ──

export const occupancySummaryOutput = z.object({
	total: z.number().int(),
	occupied: z.number().int(),
	available: z.number().int(),
	maintenance: z.number().int(),
	inactive: z.number().int(),
	occupancyRate: z
		.number()
		.describe("Percentage of non-inactive units that are occupied (0–100)"),
});

// ── Rent collection ──

// A single lease-level row inside the rent collection report
export const rentCollectionRow = z.object({
	leaseId: z.number().int(),
	unitId: z.number().int(),
	unitName: z.string(),
	tenantId: z.number().int(),
	tenantName: z.string(),
	rentDue: z.string().describe("Numeric string — expected rent amount"),
	collected: z.string().describe("Numeric string — total payments received"),
	outstanding: z
		.string()
		.describe("Numeric string — positive = arrears owed, negative = overpaid"),
});

export const rentCollectionInput = dateRangeInput.extend({
	// If omitted the report covers the current calendar month
	unitId: z.number().int().positive().optional(),
});

export const rentCollectionOutput = z.object({
	period: z.object({
		from: z.iso.date(),
		to: z.iso.date(),
	}),
	totalExpected: z.string(),
	totalCollected: z.string(),
	totalOutstanding: z.string(),
	rows: z.array(rentCollectionRow),
});

// -- Payments --

export const paymentOverviewRow = z.object({
	paymentId: z.number().int(),
	leaseId: z.number().int(),
	unitId: z.number().int(),
	unitName: z.string(),
	tenantId: z.number().int(),
	tenantName: z.string(),
	paymentAmount: z.string(),
	paymentType: z.enum(paymentTypeEnum.enumValues),
	paymentMethod: z.enum(paymentMethodEnum.enumValues),
	paymentDate: z.string(),
	balanceAfter: z.string(),
	receiptNumber: z.string().nullable(),
	description: z.string().nullable(),
});

export const paymentOverviewInput = z.object({
	// Pagination
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(5),

	// Filters — all optional, omit for dashboard defaults
	from: z.iso.date("from must be a valid ISO date (YYYY-MM-DD)").optional(),
	to: z.iso.date("to must be a valid ISO date (YYYY-MM-DD)").optional(),
	unitId: z.number().int().positive().optional(),
	paymentType: z.enum(paymentTypeEnum.enumValues).optional(),
	paymentMethod: z.enum(paymentMethodEnum.enumValues).optional(),
});

export const paymentOverviewOutput = z.object({
	items: z.array(paymentOverviewRow),
	nextCursor: z.number().positive().nullable(),
});

// ── Arrears ──

export const arrearsRow = z.object({
	leaseId: z.number().int(),
	unitId: z.number().int(),
	unitName: z.string(),
	tenantId: z.number().int(),
	tenantName: z.string(),
	tenantPhone: z.string(),
	currentBalance: z
		.string()
		.describe(
			"Running balance — negative means the tenant owes money (arrears)",
		),
	arrearsAmount: z
		.string()
		.describe(
			"Absolute arrears amount (positive). Zero if tenant is not in arrears.",
		),
	monthsOverdue: z.number().int().describe("Approximate months in arrears"),
});

export const arrearsOverviewOutput = z.object({
	totalArrears: z.string(),
	tenantsInArrears: z.number().int(),
	tenantsInTotal: z.number().int(),
	rows: z.array(arrearsRow),
});

// ── Upcoming rent due ──

export const upcomingRentDueRow = z.object({
	leaseId: z.number().int(),
	unitId: z.number().int(),
	unitName: z.string(),
	tenantId: z.number().int(),
	tenantName: z.string(),
	tenantPhone: z.string(),
	rentAmount: z.string(),
	dueDate: z.iso.date().describe("Date rent is next due"),
	daysUntilDue: z.number().int(),
});

export const upcomingRentDueInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(90)
		.default(30)
		.describe("How many days ahead to look"),
});

export const upcomingRentDueOutput = z.object({
	rows: z.array(upcomingRentDueRow),
});

// ── Expiring documents ──

export const expiringDocumentRow = z.object({
	id: z.number().int(),
	documentType: z.string(),
	label: z.string(),
	expiryDate: z.iso.date(),
	daysUntilExpiry: z.number().int(),

	// Which resource this document belongs to
	resourceType: z.enum(["unit", "tenant", "lease"]),
	resourceId: z.number().int(),
	resourceName: z.string(),
});

export const expiringDocumentsInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(365)
		.default(30)
		.describe("How many days ahead to look for expiring documents"),
});

export const expiringDocumentsOutput = z.object({
	rows: z.array(expiringDocumentRow),
});

// ── Upcoming inspections ──

export const upcomingInspectionRow = z.object({
	id: z.number().int(),
	title: z.string(),
	unitId: z.number().int(),
	unitName: z.string(),
	scheduledDate: z.iso.date(),
	daysUntilInspection: z.number().int(),
	assignedUserName: z.string().nullable(),
});

export const upcomingInspectionsInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(90)
		.default(30)
		.describe("How many days ahead to look"),
	unitId: z.number().int().positive().optional(),
});

export const upcomingInspectionsOutput = z.object({
	rows: z.array(upcomingInspectionRow),
});

// ── Overdue utility bills ──

export const overdueUtilityBillRow = z.object({
	billId: z.number().int(),
	utilityId: z.number().int(),
	utilityType: z.string(),
	unitId: z.number().int(),
	unitName: z.string(),
	billAmount: z.string(),
	previousDueAmount: z.string(),
	periodEnd: z.iso.date(),
	daysPastDue: z.number().int(),
	status: z.string(),
});

export const overdueUtilityBillsOutput = z.object({
	totalOverdue: z.string(),
	rows: z.array(overdueUtilityBillRow),
});

// ── Repair summary ──

export const repairSummaryOutput = z.object({
	open: z.number().int(),
	inProgress: z.number().int(),
	resolved: z.number().int(),
	cancelled: z.number().int(),
	byPriority: z.object({
		low: z.number().int(),
		medium: z.number().int(),
		high: z.number().int(),
		urgent: z.number().int(),
	}),
	byType: z.object({
		plumbing: z.number().int(),
		electrical: z.number().int(),
		structural: z.number().int(),
		other: z.number().int(),
	}),
});

export const repairSummaryInput = z.object({
	unitId: z.number().int().positive().optional(),
});

// ── Leases expiring soon ──

export const expiringLeaseRow = z.object({
	leaseId: z.number().int(),
	unitId: z.number().int(),
	unitName: z.string(),
	tenantId: z.number().int(),
	tenantName: z.string(),
	tenantPhone: z.string(),
	endDate: z.iso.date(),
	daysUntilExpiry: z.number().int(),
	status: z.string(),
});

export const expiringLeasesInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(180)
		.default(45)
		.describe("How many days ahead to look for expiring leases"),
});

export const expiringLeasesOutput = z.object({
	rows: z.array(expiringLeaseRow),
});
