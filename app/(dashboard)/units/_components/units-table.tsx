"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import { Role } from "@/types/role";
import {
	UNIT_STATUS_FILTER_OPTIONS,
	UNIT_STATUS_META,
	UNIT_TYPE_FILTER_OPTIONS,
	UNIT_TYPE_META,
	UTILITY_BILLING_MODE_FILTER_OPTIONS,
	UTILITY_BILLING_MODE_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatCurrency, formatExportDate } from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import type { ListUnitOutput } from "@/app/schemas/unit.schema";
import type { Table } from "@tanstack/react-table";

type UnitTableProps = {
	role: Role;
};

export default function UnitsTable({ role }: UnitTableProps) {
	const { data: { items: units } = { items: [] } } = useSuspenseQuery(
		orpc.unit.list.queryOptions({ input: {} }),
	);

	const facetedFilters = [
		{
			title: "Type",
			columnId: "type",
			options: UNIT_TYPE_FILTER_OPTIONS,
		},
		{
			title: "Status",
			columnId: "status",
			options: UNIT_STATUS_FILTER_OPTIONS,
		},
		{
			title: "Billing Mode",
			columnId: "utilityBilling",
			options: UTILITY_BILLING_MODE_FILTER_OPTIONS,
		},
	];

	type UnitRow = ListUnitOutput["items"][number];

	const renderToolbarActions = (table: Table<UnitRow>) => {
		const sortedRows = table.getSortedRowModel().rows;

		const exportRows = sortedRows.map(({ original: unit }) => ({
			unit: unit.name,
			type:
				UNIT_TYPE_META[unit.type as keyof typeof UNIT_TYPE_META]?.label ??
				unit.type,
			status:
				UNIT_STATUS_META[unit.status as keyof typeof UNIT_STATUS_META]?.label ??
				unit.status,
			address: unit.address,
			tenant: unit.activeLease?.tenant
				? `${unit.activeLease.tenant.firstName} ${unit.activeLease.tenant.lastName ?? ""}`.trim()
				: "No tenant",
			billingMode:
				UTILITY_BILLING_MODE_META[
					unit.utilityBillingMode as keyof typeof UTILITY_BILLING_MODE_META
				]?.label ?? unit.utilityBillingMode,
			rent: unit.activeLease?.currentRent?.rentAmount
				? formatCurrency(unit.activeLease.currentRent.rentAmount)
				: "No tenant",
			leaseEnd: unit.activeLease?.endDate
				? formatExportDate(unit.activeLease.endDate)
				: "No tenant",
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();

		if (globalSearch) {
			filterParts.push(`Search: ${globalSearch}`);
		}

		const typeFilter = table.getColumn("type")?.getFilterValue() as string[] | undefined;
		if (typeFilter?.length) {
			const typeLabels = typeFilter.map(
				(value) => UNIT_TYPE_META[value as keyof typeof UNIT_TYPE_META]?.label ?? value,
			);
			filterParts.push(`Type: ${typeLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) => UNIT_STATUS_META[value as keyof typeof UNIT_STATUS_META]?.label ?? value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const billingFilter = table
			.getColumn("utilityBilling")
			?.getFilterValue() as string[] | undefined;
		if (billingFilter?.length) {
			const billingLabels = billingFilter.map(
				(value) =>
					UTILITY_BILLING_MODE_META[
						value as keyof typeof UTILITY_BILLING_MODE_META
					]?.label ?? value,
			);
			filterParts.push(`Billing mode: ${billingLabels.join(", ")}`);
		}

		const filterText = filterParts.length ? filterParts.join(" | ") : "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("units", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "units",
						title: "Units Report",
						filters: filterText,
						headers: [
							"Unit",
							"Type",
							"Status",
							"Address",
							"Tenant",
							"Billing Mode",
							"Rent",
							"Lease End",
						],
						rows: exportRows.map((row) => [
							row.unit,
							row.type,
							row.status,
							row.address,
							row.tenant,
							row.billingMode,
							row.rent,
							row.leaseEnd,
						]),
						summary: [
							{
								metric: "Units in scope",
								value: `${exportRows.length}`,
							},
						],
					})
				}
			/>
		);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={units}
					columns={columns(role)}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
				/>
			</CardContent>
		</Card>
	);
}
