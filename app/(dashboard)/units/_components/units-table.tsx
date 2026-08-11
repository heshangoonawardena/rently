"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import type { ListUnitOutput } from "@/app/schemas/unit.schema";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card, CardContent } from "@/components/ui/card";
import {
	UNIT_STATUS_FILTER_OPTIONS,
	UNIT_STATUS_META,
	UNIT_TYPE_FILTER_OPTIONS,
	UNIT_TYPE_META,
	UTILITY_BILLING_MODE_FILTER_OPTIONS,
	UTILITY_BILLING_MODE_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { formatCurrency, formatExportDate } from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { columns } from "./columns";

const DEFAULT_PAGE_SIZE = 10;

type UnitTableProps = {
	role: Role;
};

export default function UnitsTable({ role }: UnitTableProps) {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([]);
	const [currentCursor, setCurrentCursor] = useState<number | null>(null);

	const { data } = useSuspenseQuery(
		orpc.unit.list.queryOptions({
			input: {
				limit: pageSize,
				cursor: currentCursor ?? undefined,
			},
		}),
	);

	const units = data.items;
	const nextCursor = data.nextCursor;

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

		const typeFilter = table.getColumn("type")?.getFilterValue() as
			| string[]
			| undefined;
		if (typeFilter?.length) {
			const typeLabels = typeFilter.map(
				(value) =>
					UNIT_TYPE_META[value as keyof typeof UNIT_TYPE_META]?.label ?? value,
			);
			filterParts.push(`Type: ${typeLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as
			| string[]
			| undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) =>
					UNIT_STATUS_META[value as keyof typeof UNIT_STATUS_META]?.label ??
					value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const billingFilter = table.getColumn("utilityBilling")?.getFilterValue() as
			| string[]
			| undefined;
		if (billingFilter?.length) {
			const billingLabels = billingFilter.map(
				(value) =>
					UTILITY_BILLING_MODE_META[
						value as keyof typeof UTILITY_BILLING_MODE_META
					]?.label ?? value,
			);
			filterParts.push(`Billing mode: ${billingLabels.join(", ")}`);
		}

		const filterText = filterParts.length
			? filterParts.join(" | ")
			: "All records";

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

	const handlePageSizeChange = (nextPageSize: number) => {
		setPageSize(nextPageSize);
		setCursorHistory([]);
		setCurrentCursor(null);
	};

	const handlePreviousPage = () => {
		setCursorHistory((history) => {
			if (history.length === 0) return history;
			const nextHistory = history.slice(0, -1);
			setCurrentCursor(history[history.length - 1]);
			return nextHistory;
		});
	};

	const handleNextPage = () => {
		if (nextCursor === null) return;

		setCursorHistory((history) => [...history, currentCursor]);
		setCurrentCursor(nextCursor);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={units}
					columns={columns(role)}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
					pagination={{
						mode: "cursor",
						currentPage: cursorHistory.length + 1,
						pageSize,
						canPreviousPage: cursorHistory.length > 0,
						canNextPage: nextCursor !== null,
						onPageSizeChange: handlePageSizeChange,
						onPreviousPage: handlePreviousPage,
						onNextPage: handleNextPage,
					}}
				/>
			</CardContent>
		</Card>
	);
}
