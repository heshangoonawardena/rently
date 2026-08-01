"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import { Role } from "@/types/role";
import {
	INSPECTION_STATUS_FILTER_OPTIONS,
	INSPECTION_STATUS_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatExportDate } from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import type { ListInspectionOutput } from "@/app/schemas/inspection.schema";
import type { Table } from "@tanstack/react-table";

type InspectionsTableProps = {
	role: Role;
};

export default function InspectionsTable({ role }: InspectionsTableProps) {
	const {
		data: { items: inspections },
	} = useSuspenseQuery(orpc.inspection.list.queryOptions({ input: {} }));

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

		const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) => INSPECTION_STATUS_META[value as keyof typeof INSPECTION_STATUS_META]?.label ?? value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const filterText = filterParts.length ? filterParts.join(" | ") : "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("inspections", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "inspections",
						title: "Inspections Report",
						filters: filterText,
						headers: ["Title", "Unit", "Scheduled", "Completed", "Status", "Created"],
						rows: exportRows.map((row) => [
							row.title,
							row.unitId,
							row.scheduledDate,
							row.completedDate,
							row.status,
							row.createdAt,
						]),
						summary: [{ metric: "Inspections in scope", value: `${exportRows.length}` }],
					})
				}
			/>
		);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={inspections}
					columns={columns(role)}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
				/>
			</CardContent>
		</Card>
	);
}
