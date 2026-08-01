"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import {
	LEASE_STATUS_FILTER_OPTIONS,
	LEASE_STATUS_META,
	UTILITY_BILLING_MODE_FILTER_OPTIONS,
	UTILITY_BILLING_MODE_META,
} from "@/config/table-facet-meta";
import { Role } from "@/types/role";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatCurrency, formatExportDate } from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import type { ListLeaseOutput } from "@/app/schemas/lease.schema";
import type { Table } from "@tanstack/react-table";

type LeasesTableProps = {
	role: Role;
};

export default function LeasesTable({ role }: LeasesTableProps) {
	const {
		data: { items: leases },
	} = useSuspenseQuery(orpc.lease.list.queryOptions({ input: {}}));

	const facetedFilters = [
		{
			title: "Billing Mode",
			columnId: "utilityBilling",
			options: UTILITY_BILLING_MODE_FILTER_OPTIONS,
		},
		{
			title: "Status",
			columnId: "status",
			options: LEASE_STATUS_FILTER_OPTIONS,
		},
	];

	type LeaseRow = ListLeaseOutput["items"][number];

	const renderToolbarActions = (table: Table<LeaseRow>) => {
		const sortedRows = table.getSortedRowModel().rows;
		const exportRows = sortedRows.map(({ original: lease }) => ({
			unit: lease.unit.name,
			tenant: `${lease.tenant.firstName} ${lease.tenant.lastName ?? ""}`.trim(),
			rent: formatCurrency(lease.currentRent?.rentAmount ?? 0),
			leasePeriod: `${lease.startDate} → ${lease.endDate ?? "Ongoing"}`,
			deposit: formatCurrency(lease.depositAmount),
			billingMode:
				UTILITY_BILLING_MODE_META[
					lease.unit.utilityBillingMode as keyof typeof UTILITY_BILLING_MODE_META
				]?.label ?? lease.unit.utilityBillingMode,
			status: LEASE_STATUS_META[lease.status as keyof typeof LEASE_STATUS_META]?.label ?? lease.status,
			startDate: formatExportDate(lease.startDate),
			endDate: lease.endDate ? formatExportDate(lease.endDate) : "Ongoing",
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();
		if (globalSearch) filterParts.push(`Search: ${globalSearch}`);

		const billingFilter = table.getColumn("utilityBilling")?.getFilterValue() as string[] | undefined;
		if (billingFilter?.length) {
			const billingLabels = billingFilter.map(
				(value) => UTILITY_BILLING_MODE_META[value as keyof typeof UTILITY_BILLING_MODE_META]?.label ?? value,
			);
			filterParts.push(`Billing mode: ${billingLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) => LEASE_STATUS_META[value as keyof typeof LEASE_STATUS_META]?.label ?? value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const filterText = filterParts.length ? filterParts.join(" | ") : "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("leases", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "leases",
						title: "Leases Report",
						filters: filterText,
						headers: ["Unit", "Tenant", "Rent", "Lease Period", "Deposit", "Billing Mode", "Status", "Start", "End"],
						rows: exportRows.map((row) => [
							row.unit,
							row.tenant,
							row.rent,
							row.leasePeriod,
							row.deposit,
							row.billingMode,
							row.status,
							row.startDate,
							row.endDate,
						]),
						summary: [{ metric: "Leases in scope", value: `${exportRows.length}` }],
					})
				}
			/>
		);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={leases}
					columns={columns(role)}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
				/>
			</CardContent>
		</Card>
	);
}
