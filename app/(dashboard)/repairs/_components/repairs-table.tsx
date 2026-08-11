"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import type { ListRepairRequestOutput } from "@/app/schemas/repair.request.schema";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card, CardContent } from "@/components/ui/card";
import {
	REPAIR_PRIORITY_FILTER_OPTIONS,
	REPAIR_PRIORITY_META,
	REPAIR_STATUS_FILTER_OPTIONS,
	REPAIR_STATUS_META,
	REPAIR_TYPE_FILTER_OPTIONS,
	REPAIR_TYPE_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { formatExportDate } from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { columns } from "./columns";
import RepairUpdatesTable from "./repair-updates-table";

const DEFAULT_PAGE_SIZE = 10;

export type RepairsTableProps = {
	role: Role;
};

export default function RepairsTable({ role }: RepairsTableProps) {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([]);
	const [currentCursor, setCurrentCursor] = useState<number | null>(null);

	const { data } = useSuspenseQuery(
		orpc.repair.list.queryOptions({
			input: {
				limit: pageSize,
				cursor: currentCursor ?? undefined,
			},
		}),
	);

	const repairs = data.items;
	const nextCursor = data.nextCursor;

	const facetedFilters = [
		{
			title: "Type",
			columnId: "repairType",
			options: REPAIR_TYPE_FILTER_OPTIONS,
		},
		{
			title: "Priority",
			columnId: "priority",
			options: REPAIR_PRIORITY_FILTER_OPTIONS,
		},
		{
			title: "Status",
			columnId: "status",
			options: REPAIR_STATUS_FILTER_OPTIONS,
		},
	];

	type RepairRow = ListRepairRequestOutput["items"][number];

	const renderToolbarActions = (table: Table<RepairRow>) => {
		const sortedRows = table.getSortedRowModel().rows;
		const exportRows = sortedRows.map(({ original: repair }) => ({
			repairId: repair.id,
			unitId: repair.unitId,
			title: repair.title,
			type:
				REPAIR_TYPE_META[repair.repairType as keyof typeof REPAIR_TYPE_META]
					?.label ?? repair.repairType,
			priority:
				REPAIR_PRIORITY_META[
					repair.priority as keyof typeof REPAIR_PRIORITY_META
				]?.label ?? repair.priority,
			status:
				REPAIR_STATUS_META[repair.status as keyof typeof REPAIR_STATUS_META]
					?.label ?? repair.status,
			description: repair.description ?? "-",
			createdAt: formatExportDate(repair.createdAt.toString()),
			updatedAt: formatExportDate(repair.updatedAt.toString()),
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();
		if (globalSearch) filterParts.push(`Search: ${globalSearch}`);

		const typeFilter = table.getColumn("repairType")?.getFilterValue() as
			| string[]
			| undefined;
		if (typeFilter?.length) {
			const typeLabels = typeFilter.map(
				(value) =>
					REPAIR_TYPE_META[value as keyof typeof REPAIR_TYPE_META]?.label ??
					value,
			);
			filterParts.push(`Type: ${typeLabels.join(", ")}`);
		}

		const priorityFilter = table.getColumn("priority")?.getFilterValue() as
			| string[]
			| undefined;
		if (priorityFilter?.length) {
			const priorityLabels = priorityFilter.map(
				(value) =>
					REPAIR_PRIORITY_META[value as keyof typeof REPAIR_PRIORITY_META]
						?.label ?? value,
			);
			filterParts.push(`Priority: ${priorityLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as
			| string[]
			| undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) =>
					REPAIR_STATUS_META[value as keyof typeof REPAIR_STATUS_META]?.label ??
					value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const filterText = filterParts.length
			? filterParts.join(" | ")
			: "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("repairs", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "repairs",
						title: "Repairs Report",
						filters: filterText,
						headers: [
							"Repair ID",
							"Unit",
							"Title",
							"Type",
							"Priority",
							"Status",
							"Description",
							"Created",
							"Updated",
						],
						rows: exportRows.map((row) => [
							row.repairId,
							row.unitId,
							row.title,
							row.type,
							row.priority,
							row.status,
							row.description,
							row.createdAt,
							row.updatedAt,
						]),
						summary: [
							{ metric: "Repairs in scope", value: `${exportRows.length}` },
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
					data={repairs}
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
					renderRowSubComponent={(row) => (
						<RepairUpdatesTable
							role={role}
							repairRequestId={row.original.id}
							currentStatus={row.original.status}
						/>
					)}
				/>
			</CardContent>
		</Card>
	);
}
