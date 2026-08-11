"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import type { ListInspectionOutput } from "@/app/schemas/inspection.schema";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card, CardContent } from "@/components/ui/card";
import {
	INSPECTION_STATUS_FILTER_OPTIONS,
	INSPECTION_STATUS_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { formatExportDate } from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { columns } from "./columns";

const DEFAULT_PAGE_SIZE = 10;

type InspectionsTableProps = {
	role: Role;
};

export default function InspectionsTable({ role }: InspectionsTableProps) {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([]);
	const [currentCursor, setCurrentCursor] = useState<number | null>(null);

	const {
		data: { items: inspections, nextCursor },
	} = useSuspenseQuery(
		orpc.inspection.list.queryOptions({
			input: {
				limit: pageSize,
				cursor: currentCursor ?? undefined,
			},
		}),
	);

	const facetedFilters = [
		{
			title: "Status",
			columnId: "status",
			options: INSPECTION_STATUS_FILTER_OPTIONS,
		},
	];

	type InspectionRow = ListInspectionOutput["items"][number];

	const renderToolbarActions = (table: Table<InspectionRow>) => {
		const sortedRows = table.getSortedRowModel().rows;
		const exportRows = sortedRows.map(({ original: inspection }) => ({
			title: inspection.title,
			unitId: inspection.unitId,
			scheduledDate: formatExportDate(inspection.scheduledDate),
			completedDate: inspection.completedDate
				? formatExportDate(inspection.completedDate)
				: "Pending",
			status:
				INSPECTION_STATUS_META[
					inspection.status as keyof typeof INSPECTION_STATUS_META
				]?.label ?? inspection.status,
			createdAt: formatExportDate(inspection.createdAt.toString()),
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();
		if (globalSearch) filterParts.push(`Search: ${globalSearch}`);

		const statusFilter = table.getColumn("status")?.getFilterValue() as
			| string[]
			| undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) =>
					INSPECTION_STATUS_META[value as keyof typeof INSPECTION_STATUS_META]
						?.label ?? value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const filterText = filterParts.length
			? filterParts.join(" | ")
			: "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("inspections", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "inspections",
						title: "Inspections Report",
						filters: filterText,
						headers: [
							"Title",
							"Unit",
							"Scheduled",
							"Completed",
							"Status",
							"Created",
						],
						rows: exportRows.map((row) => [
							row.title,
							row.unitId,
							row.scheduledDate,
							row.completedDate,
							row.status,
							row.createdAt,
						]),
						summary: [
							{ metric: "Inspections in scope", value: `${exportRows.length}` },
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
					data={inspections}
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
