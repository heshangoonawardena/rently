import z from "zod";

// ── Shared primitives ──

// Used by any endpoint that accepts a date-range filter
export const DateRangeInput = z.object({
	from: z.iso.date("from must be a valid ISO date (YYYY-MM-DD)").optional(),
	to: z.iso.date("to must be a valid ISO date (YYYY-MM-DD)").optional(),
});

// ── Occupancy ──

export const OccupancySummaryOutput = z.object({
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
export const RentCollectionRow = z.object({
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

export const RentCollectionInput = DateRangeInput.extend({
	// If omitted the report covers the current calendar month
	unitId: z.number().int().positive().optional(),
});

export const RentCollectionOutput = z.object({
	period: z.object({
		from: z.iso.date(),
		to: z.iso.date(),
	}),
	totalExpected: z.string(),
	totalCollected: z.string(),
	totalOutstanding: z.string(),
	rows: z.array(RentCollectionRow),
});

// ── Arrears ──

export const ArrearsRow = z.object({
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

export const ArrearsOverviewOutput = z.object({
	totalArrears: z.string(),
	tenantsInArrears: z.number().int(),
	rows: z.array(ArrearsRow),
});

// ── Upcoming rent due ──

export const UpcomingRentDueRow = z.object({
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

export const UpcomingRentDueInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(90)
		.default(30)
		.describe("How many days ahead to look"),
});

export const UpcomingRentDueOutput = z.object({
	rows: z.array(UpcomingRentDueRow),
});

// ── Expiring documents ──

export const ExpiringDocumentRow = z.object({
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

export const ExpiringDocumentsInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(365)
		.default(30)
		.describe("How many days ahead to look for expiring documents"),
});

export const ExpiringDocumentsOutput = z.object({
	rows: z.array(ExpiringDocumentRow),
});

// ── Upcoming inspections ──

export const UpcomingInspectionRow = z.object({
	id: z.number().int(),
	title: z.string(),
	unitId: z.number().int(),
	unitName: z.string(),
	scheduledDate: z.iso.date(),
	daysUntilInspection: z.number().int(),
	assignedUserName: z.string().nullable(),
});

export const UpcomingInspectionsInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(90)
		.default(30)
		.describe("How many days ahead to look"),
	unitId: z.number().int().positive().optional(),
});

export const UpcomingInspectionsOutput = z.object({
	rows: z.array(UpcomingInspectionRow),
});

// ── Overdue utility bills ──

export const OverdueUtilityBillRow = z.object({
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

export const OverdueUtilityBillsOutput = z.object({
	totalOverdue: z.string(),
	rows: z.array(OverdueUtilityBillRow),
});

// ── Repair summary ──

export const RepairSummaryOutput = z.object({
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

export const RepairSummaryInput = z.object({
	unitId: z.number().int().positive().optional(),
});

// ── Leases expiring soon ──

export const ExpiringLeaseRow = z.object({
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

export const ExpiringLeasesInput = z.object({
	daysAhead: z
		.number()
		.int()
		.min(1)
		.max(180)
		.default(60)
		.describe("How many days ahead to look for expiring leases"),
});

export const ExpiringLeasesOutput = z.object({
	rows: z.array(ExpiringLeaseRow),
});
