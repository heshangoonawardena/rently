"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowLeft,
	ArrowRight,
	Bed,
	Download,
	FileText,
	Home,
	MapIcon,
	MapPin,
	Settings,
	User,
	Warehouse,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEASE_SETTLEMENT_EXPENSE_CATEGORY_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { EditLeaseModal } from "../../_components/edit-lease-modal";

type LeaseHeaderProps = {
	id: number;
	role: Role;
};

export function LeaseHeader({ id, role }: LeaseHeaderProps) {
	const { data: lease } = useSuspenseQuery(
		orpc.lease.get.queryOptions({ input: { id: id } }),
	);

	const { data: paymentData, isFetching: isFetchingPayments } = useQuery(
		orpc.payment.list.queryOptions({
			input: { leaseId: id, limit: 100 },
		}),
	);

	const { data: rentHistoryData, isFetching: isFetchingRents } = useQuery(
		orpc.lease.listRents.queryOptions({
			input: { leaseId: id, limit: 100 },
		}),
	);

	const { data: inspectionsData, isFetching: isFetchingInspections } = useQuery(
		orpc.inspection.list.queryOptions({
			input: { unitId: lease.unitId, limit: 100 },
		}),
	);

	const { data: repairsData, isFetching: isFetchingRepairs } = useQuery(
		orpc.repair.list.queryOptions({
			input: { unitId: lease.unitId, limit: 100 },
		}),
	);
	const [hasHydrated, setHasHydrated] = React.useState(false);
	const [clientNow, setClientNow] = React.useState<number | null>(null);

	React.useEffect(() => {
		setHasHydrated(true);
		setClientNow(Date.now());
	}, []);

	const isReportLoading =
		hasHydrated &&
		(isFetchingPayments ||
			isFetchingRents ||
			isFetchingInspections ||
			isFetchingRepairs);

	const rent = lease.currentRent?.rentAmount ?? 0;
	const deposit = lease.depositAmount ?? 0;

	const formatter = new Intl.NumberFormat("en-LK", {
		style: "currency",
		currency: "LKR",
		maximumFractionDigits: 0,
	});

	const formatDate = (date: string | null) =>
		date
			? new Date(date).toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				})
			: "Ongoing";

	const getSettlementCategoryLabel = (category?: string | null) => {
		if (!category) {
			return "";
		}

		return (
			LEASE_SETTLEMENT_EXPENSE_CATEGORY_FILTER_OPTIONS.find(
				(option) => option.value === category,
			)?.label ?? category
		);
	};

	const unitTypeIcons = {
		house: Home,
		warehouse: Warehouse,
		room: Bed,
		land: MapIcon,
	};

	const Icon =
		unitTypeIcons[lease.unit.type.toLowerCase() as keyof typeof unitTypeIcons];

	const createdAtMs = new Date(lease.createdAt).getTime();
	const isEditLocked =
		clientNow !== null &&
		Number.isFinite(createdAtMs) &&
		clientNow - createdAtMs > 10 * 60 * 1000;

	function handleGenerateReport() {
		const payments = paymentData?.items ?? [];
		const rentHistory = rentHistoryData?.items ?? [];
		const inspections = inspectionsData?.items ?? [];
		const repairs = repairsData?.items ?? [];

		const totalIncoming = payments
			.filter(
				(payment) =>
					!["refund", "deposit_deduction"].includes(payment.paymentType),
			)
			.reduce((sum, payment) => sum + Number(payment.paymentAmount), 0);

		const totalOutgoing = payments
			.filter((payment) =>
				["refund", "deposit_deduction"].includes(payment.paymentType),
			)
			.reduce((sum, payment) => sum + Number(payment.paymentAmount), 0);

		const reportRows: string[][] = [];

		reportRows.push([
			"Lease",
			format(new Date(lease.createdAt), "yyyy-MM-dd"),
			`Lease #${lease.id}`,
			`${lease.unit.name} | Tenant: ${lease.tenant.firstName} ${lease.tenant.lastName ?? ""}`.trim(),
			"",
		]);

		for (const rent of rentHistory) {
			reportRows.push([
				"Rent History",
				rent.effectiveDate,
				`Rent Revision #${rent.id}`,
				`Agreed payment day: ${rent.agreedPaymentDay}${rent.description ? ` | ${rent.description}` : ""}`,
				`LKR ${Number(rent.rentAmount).toLocaleString()}`,
			]);
		}

		for (const payment of payments) {
			reportRows.push([
				"Payment",
				payment.paymentDate,
				`#${payment.id} (${payment.paymentType})`,
				`Method: ${payment.paymentMethod}${payment.description ? ` | ${payment.description}` : ""}`,
				`LKR ${Number(payment.paymentAmount).toLocaleString()}`,
			]);
		}

		for (const inspection of inspections) {
			reportRows.push([
				"Inspection",
				inspection.scheduledDate,
				`#${inspection.id} (${inspection.status})`,
				`${inspection.title}${inspection.description ? ` | ${inspection.description}` : ""}`,
				"",
			]);
		}

		for (const repair of repairs) {
			reportRows.push([
				"Repair",
				format(new Date(repair.createdAt), "yyyy-MM-dd"),
				`#${repair.id} (${repair.status})`,
				`${repair.title} [${repair.repairType}/${repair.priority}]${repair.description ? ` | ${repair.description}` : ""}`,
				"",
			]);
		}

		if (lease.settlement) {
			reportRows.push([
				"Settlement",
				lease.settlement.terminationDate,
				`Settlement #${lease.settlement.id}`,
				"Final lease deposit settlement",
				`LKR ${Number(lease.settlement.refundAmount).toLocaleString()} refund`,
			]);

			for (const expense of lease.settlement.expenses) {
				reportRows.push([
					"Settlement Expense",
					format(new Date(expense.createdAt), "yyyy-MM-dd"),
					`Expense #${expense.id}`,
					`${expense.label}${expense.category ? ` (${getSettlementCategoryLabel(expense.category)})` : ""}${expense.notes ? ` | ${expense.notes}` : ""}`,
					`LKR ${Number(expense.amount).toLocaleString()}`,
				]);
			}
		}

		exportPdf({
			filename: `lease-${lease.id}-report`,
			title: `Lease Report - ${lease.unit.name}`,
			filters: `Lease period: ${formatDate(lease.startDate)} to ${formatDate(lease.endDate)} | Status: ${lease.status}`,
			headers: ["Section", "Date", "Reference", "Details", "Amount"],
			rows: reportRows,
			summary: [
				{ metric: "Lease ID", value: String(lease.id) },
				{
					metric: "Tenant",
					value:
						`${lease.tenant.firstName} ${lease.tenant.lastName ?? ""}`.trim(),
				},
				{ metric: "Unit", value: lease.unit.name },
				{ metric: "Rent revisions", value: String(rentHistory.length) },
				{ metric: "Payments", value: String(payments.length) },
				{ metric: "Inspections", value: String(inspections.length) },
				{ metric: "Repairs", value: String(repairs.length) },
				{
					metric: "Total incoming",
					value: `LKR ${totalIncoming.toLocaleString()}`,
				},
				{
					metric: "Total outgoing",
					value: `LKR ${totalOutgoing.toLocaleString()}`,
				},
			],
		});
	}

	return (
		<div className="space-y-6">
			<Button asChild variant="ghost" size="sm" className="mr-auto">
				<Link href="/leases">
					<ArrowLeft className="mr-2 size-4" />
					Back to Leases
				</Link>
			</Button>

			{/* Header */}
			<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
				<div className="flex gap-4">
					<Avatar className="size-16">
						<AvatarFallback className="text-lg font-semibold">
							<Icon className="size-fit" />
						</AvatarFallback>
					</Avatar>

					<div className="space-y-2 space-x-2">
						<div>
							<h1 className="text-2xl font-bold tracking-tight">
								{lease.unit.name}
							</h1>

							<div className="flex items-center gap-2">
								<User className="size-4" />
								{role !== "tenant" ? (
									<>
										{lease.tenant?.nickname} - ({lease.tenant.firstName}{" "}
										{lease.tenant?.lastName})
									</>
								) : (
									<>
										{lease.tenant.firstName} {lease.tenant?.lastName}
									</>
								)}
							</div>
						</div>

						<div className="flex items-center 	text-sm text-muted-foreground gap-2">
							<MapPin className="size-4" />
							{lease.unit.address}
						</div>

						<Badge
							className={
								lease.status === "active"
									? "bg-chart-2 text-white capitalize"
									: lease.status === "ended"
										? "bg-chart-1 text-white capitalize"
										: lease.status === "extended"
											? "bg-chart-3 text-white capitalize"
											: lease.status === "terminated"
												? "bg-chart-3 text-white capitalize"
												: "capitalize"
							}
						>
							{lease.status}
						</Badge>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					{role !== "tenant" && !isEditLocked && (
						<div>
							<EditLeaseModal data={lease} />
						</div>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" disabled={isReportLoading}>
								<Settings className="size-4 mr-2" />
								Actions
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleGenerateReport}>
								<FileText className="size-4 mr-2" />
								{isReportLoading ? "Preparing data..." : "Generate PDF Report"}
							</DropdownMenuItem>
							<DropdownMenuItem disabled>
								<Download className="size-4 mr-2" />
								Export Data (coming soon)
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<Card>
				<CardContent className="space-y-6 p-6">
					{/* Summary */}
					<div className="grid gap-4 md:grid-cols-4 grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Added On</p>

							<p className="font-semibold">
								{format(lease.createdAt, "dd MMM yyyy")}
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Rent</p>

							<p className="font-semibold capitalize">
								{formatter.format(rent)}/ month
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground capitalize">
								Deposit
							</p>

							<p className="font-semibold">
								{formatter.format(Number(deposit))}
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Lease Period</p>
							<div className="flex gap-2 items-center">
								{formatDate(lease.startDate)}
								<ArrowRight />
								{lease.endDate ? formatDate(lease.endDate) : "No end date"}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
