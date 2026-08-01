import type { ComponentType } from "react";
import {
	Banknote,
	Bed,
	CheckCircle2,
	CircleAlert,
	CircleCheck,
	CircleHelp,
	CircleX,
	Clock3,
	CreditCard,
	Droplet,
	Droplets,
	FileText,
	Gauge,
	Hammer,
	HandCoins,
	Home,
	Landmark,
	LoaderCircle,
	Map,
	Paintbrush,
	ShieldAlert,
	Undo2,
	UserCog,
	UserRoundCheck,
	UserRoundX,
	Users,
	Warehouse,
	Wrench,
	XCircle,
	Zap,
} from "lucide-react";

type FacetIcon = ComponentType<{ className?: string }>;

type FacetMeta = {
	label: string;
	icon: FacetIcon;
	color?: string;
};

type ReportFacetMeta = FacetMeta & {
	chartColor: string;
	badgeClass: string;
};

function toFilterOptions<T extends Record<string, FacetMeta>>(meta: T) {
	return Object.entries(meta).map(([value, config]) => ({
		value,
		label: config.label,
		icon: config.icon,
		color: config.color ?? " ",
	}));
}

export const UNIT_TYPE_META = {
	room: { label: "Room", icon: Bed },
	house: { label: "House", icon: Home },
	warehouse: { label: "Warehouse", icon: Warehouse },
	land: { label: "Land", icon: Map },
} as const satisfies Record<string, FacetMeta>;

export const UNIT_STATUS_META = {
	available: {
		label: "Available",
		icon: CheckCircle2,
		color: "border-chart-1 text-chart-1 dark:text-chart-1",
	},
	occupied: {
		label: "Occupied",
		icon: Users,
		color: "border-chart-2 text-chart-2 dark:text-chart-2",
	},
	maintenance: {
		label: "Maintenance",
		icon: Wrench,
		color: "border-chart-3 text-chart-3 dark:text-chart-3",
	},
	inactive: {
		label: "Inactive",
		icon: Clock3,
		color: "border-chart-4 text-chart-4 dark:text-chart-4",
	},
} as const satisfies Record<string, FacetMeta>;

export const TENANT_PORTAL_META = {
	registered: {
		label: "Registered",
		icon: UserRoundCheck,
		color: "border-chart-2 text-chart-2",
	},
	not_registered: {
		label: "Not Registered",
		icon: UserRoundX,
		color: "border-chart-4 text-chart-4",
	},
} as const satisfies Record<string, FacetMeta>;

export const TENANT_STATUS_META = {
	active: {
		label: "Active",
		icon: CircleCheck,
		color: "border-chart-2 text-chart-2",
	},
	pending: {
		label: "Pending",
		icon: Clock3,
		color: "border-chart-3 text-chart-3",
	},
	inactive: {
		label: "Inactive",
		icon: CircleX,
		color: "border-chart-5 text-chart-5",
	},
	evicted: {
		label: "Evicted",
		icon: CircleX,
		color: "border-chart-4 text-chart-4",
	},
} as const satisfies Record<string, FacetMeta>;

export const UTILITY_BILLING_MODE_META = {
	tenant_managed: { label: "Tenant Managed", icon: UserCog },
	fixed_charge: { label: "Fixed Charge", icon: Gauge },
	metered: { label: "Metered", icon: Wrench },
} as const satisfies Record<string, FacetMeta>;

export const UTILITY_TYPE_META = {
	electricity: {
		label: "Electricity",
		icon: Zap,
		color: "text-yellow-500",
	},
	water: {
		label: "Water",
		icon: Droplets,
		color: "text-blue-500",
	},
	tax: {
		label: "Tax",
		icon: Landmark,
		color: "text-emerald-600",
	},
	other: {
		label: "Other",
		icon: CircleHelp,
		color: "text-muted-foreground",
	},
} as const satisfies Record<string, FacetMeta>;

export const LEASE_STATUS_META = {
	active: {
		label: "Active",
		icon: CheckCircle2,
		color: "border-chart-2 text-chart-2",
	},
	extended: {
		label: "Extended",
		icon: Clock3,
		color: "border-chart-3 text-chart-3",
	},
	ended: {
		label: "Ended",
		icon: XCircle,
		color: "border-chart-1 text-chart-1",
	},
	terminated: {
		label: "Terminated",
		icon: XCircle,
		color: "border-chart-5 text-chart-5",
	},
} as const satisfies Record<string, FacetMeta>;

export const PAYMENT_TYPE_META = {
	rent: {
		label: "Rent",
		icon: Banknote,
		color: "border-chart-2 text-chart-2",
	},
	rent_waiver: {
		label: "Rent Waiver",
		icon: FileText,
		color: "border-chart-3 text-chart-3",
	},
	deposit: {
		label: "Deposit",
		icon: Landmark,
		color: "border-chart-3 text-chart-3",
	},
	deposit_deduction: {
		label: "Deposit Deduction",
		icon: Undo2,
		color: "border-chart-5 text-chart-5",
	},
	refund: {
		label: "Refund",
		icon: Undo2,
		color: "border-chart-3 text-chart-3",
	},
	arrear: {
		label: "Arrear",
		icon: FileText,
		color: "border-chart-1 text-chart-1",
	},
	other: {
		label: "Other",
		icon: FileText,
		color: "",
	},
} as const satisfies Record<string, FacetMeta>;

export const MANUAL_PAYMENT_TYPE_META = {
	rent: {
		label: "Rent",
		icon: Banknote,
		color: "border-chart-2 text-chart-2",
	},
	rent_waiver: {
		label: "Rent Waiver",
		icon: FileText,
		color: "border-chart-3 text-chart-3",
	},
	deposit: {
		label: "Deposit",
		icon: Landmark,
		color: "border-chart-3 text-chart-3",
	},
} as const satisfies Record<string, FacetMeta>;

export const PAYMENT_TYPE_REPORT_META = {
	rent: {
		label: PAYMENT_TYPE_META.rent.label,
		icon: PAYMENT_TYPE_META.rent.icon,
		chartColor: "var(--chart-2)",
		badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400",
	},
	arrear: {
		label: "Arrears Recovery",
		icon: PAYMENT_TYPE_META.arrear.icon,
		chartColor: "var(--chart-1)",
		badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	},
	rent_waiver: {
		label: PAYMENT_TYPE_META.rent_waiver.label,
		icon: PAYMENT_TYPE_META.rent_waiver.icon,
		chartColor: "var(--chart-4)",
		badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	},
	deposit: {
		label: "Deposits",
		icon: PAYMENT_TYPE_META.deposit.icon,
		chartColor: "var(--chart-3)",
		badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
	},
	deposit_deduction: {
		label: PAYMENT_TYPE_META.deposit_deduction.label,
		icon: PAYMENT_TYPE_META.deposit_deduction.icon,
		chartColor: "var(--chart-1)",
		badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400",
	},
} as const satisfies Record<string, ReportFacetMeta>;

export const REPORT_TIME_RANGE_META = {
	all: { label: "All time", icon: Clock3 },
	"7d": { label: "Last 7 days", icon: Clock3 },
	"30d": { label: "Last 30 days", icon: Clock3 },
	"90d": { label: "Last 90 days", icon: Clock3 },
} as const satisfies Record<string, FacetMeta>;

export const PAYMENT_METHOD_META = {
	cash: { label: "Cash", icon: HandCoins },
	bank_transfer: { label: "Bank Transfer", icon: Landmark },
	cheque: { label: "Cheque", icon: FileText },
	online: { label: "Online", icon: CreditCard },
	other: { label: "Other", icon: FileText },
} as const satisfies Record<string, FacetMeta>;

export const REPAIR_TYPE_META = {
	plumbing: {
		label: "Plumbing",
		icon: Droplet,
		color: "border-chart-2 text-chart-2",
	},
	electrical: {
		label: "Electrical",
		icon: Zap,
		color: "border-chart-4 text-chart-4",
	},
	structural: {
		label: "Structural",
		icon: Hammer,
		color: "border-chart-5 text-chart-5",
	},
	other: {
		label: "Other",
		icon: Paintbrush,
		color: "",
	},
} as const satisfies Record<string, FacetMeta>;

export const REPAIR_PRIORITY_META = {
	low: {
		label: "Low",
		icon: CircleCheck,
		color: "border-chart-2 text-chart-2",
	},
	medium: {
		label: "Medium",
		icon: CircleAlert,
		color: "border-chart-4 text-chart-4",
	},
	high: {
		label: "High",
		icon: ShieldAlert,
		color: "border-destructive text-destructive",
	},
	urgent: {
		label: "Urgent",
		icon: ShieldAlert,
		color: "border-destructive bg-destructive/10 text-destructive",
	},
} as const satisfies Record<string, FacetMeta>;

export const REPAIR_STATUS_META = {
	open: {
		label: "Open",
		icon: CircleAlert,
		color: "border-chart-4 text-chart-4",
	},
	in_progress: {
		label: "In Progress",
		icon: LoaderCircle,
		color: "border-chart-5 text-chart-5",
	},
	resolved: {
		label: "Resolved",
		icon: CircleCheck,
		color: "border-chart-2 text-chart-2",
	},
	cancelled: {
		label: "Cancelled",
		icon: CircleX,
		color: "border-destructive text-destructive",
	},
} as const satisfies Record<string, FacetMeta>;

export const UPDATE_REPAIR_STATUS_META = {
	in_progress: {
		label: "In Progress",
		icon: LoaderCircle,
		color: "border-chart-5 text-chart-5",
	},
	resolved: {
		label: "Resolved",
		icon: CircleCheck,
		color: "border-chart-2 text-chart-2",
	},
	cancelled: {
		label: "Cancelled",
		icon: CircleX,
		color: "border-destructive text-destructive",
	},
} as const satisfies Record<string, FacetMeta>;

export const INSPECTION_STATUS_META = {
	scheduled: {
		label: "Scheduled",
		icon: Clock3,
		color: "border-chart-3 text-chart-3",
	},
	rescheduled: {
		label: "Rescheduled",
		icon: Clock3,
		color: "border-chart-4 text-chart-4",
	},
	completed: {
		label: "Completed",
		icon: CircleCheck,
		color: "border-chart-2 text-chart-2",
	},
	skipped: {
		label: "Skipped",
		icon: CircleX,
		color: "border-chart-5 text-chart-5",
	},
	cancelled: {
		label: "Cancelled",
		icon: CircleX,
		color: "border-destructive text-destructive",
	},
} as const satisfies Record<string, FacetMeta>;

export const UNIT_TYPE_FILTER_OPTIONS = toFilterOptions(UNIT_TYPE_META);
export const UNIT_STATUS_FILTER_OPTIONS = toFilterOptions(UNIT_STATUS_META);
export const TENANT_PORTAL_FILTER_OPTIONS = toFilterOptions(TENANT_PORTAL_META);
export const TENANT_STATUS_FILTER_OPTIONS = toFilterOptions(TENANT_STATUS_META);
export const UTILITY_BILLING_MODE_FILTER_OPTIONS = toFilterOptions(
	UTILITY_BILLING_MODE_META,
);
export const UTILITY_TYPE_FILTER_OPTIONS = toFilterOptions(UTILITY_TYPE_META);
export const LEASE_STATUS_FILTER_OPTIONS = toFilterOptions(LEASE_STATUS_META);
export const PAYMENT_TYPE_FILTER_OPTIONS = toFilterOptions(PAYMENT_TYPE_META);
export const MANUAL_PAYMENT_TYPE_FILTER_OPTIONS = toFilterOptions(
	MANUAL_PAYMENT_TYPE_META,
);
export const PAYMENT_METHOD_FILTER_OPTIONS =
	toFilterOptions(PAYMENT_METHOD_META);
export const REPAIR_TYPE_FILTER_OPTIONS = toFilterOptions(REPAIR_TYPE_META);
export const REPAIR_PRIORITY_FILTER_OPTIONS =
	toFilterOptions(REPAIR_PRIORITY_META);
export const REPAIR_STATUS_FILTER_OPTIONS = toFilterOptions(REPAIR_STATUS_META);
export const UPDATE_REPAIR_STATUS_FILTER_OPTIONS = toFilterOptions(UPDATE_REPAIR_STATUS_META);
export const INSPECTION_STATUS_FILTER_OPTIONS = toFilterOptions(
	INSPECTION_STATUS_META,
);
export const REPORT_TIME_RANGE_FILTER_OPTIONS = toFilterOptions(
	REPORT_TIME_RANGE_META,
);
