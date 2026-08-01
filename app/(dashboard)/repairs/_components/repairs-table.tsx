"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import {
	REPAIR_PRIORITY_FILTER_OPTIONS,
	REPAIR_PRIORITY_META,
	REPAIR_STATUS_FILTER_OPTIONS,
	REPAIR_STATUS_META,
	REPAIR_TYPE_FILTER_OPTIONS,
	REPAIR_TYPE_META,
} from "@/config/table-facet-meta";
import RepairUpdatesTable from "./repair-updates-table";
import { Role } from "@/types/role";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatExportDate } from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import type { ListRepairRequestOutput } from "@/app/schemas/repair.request.schema";
import type { Table } from "@tanstack/react-table";

export type RepairsTableProps = {
	role: Role;
};

export default function RepairsTable({ role }: RepairsTableProps) {
	const { data: { items: repairs } = { items: [] } } = useSuspenseQuery(
		orpc.repair.list.queryOptions({ input: {} }),
	);

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

		const typeFilter = table.getColumn("repairType")?.getFilterValue() as string[] | undefined;
		if (typeFilter?.length) {
			const typeLabels = typeFilter.map(
				(value) => REPAIR_TYPE_META[value as keyof typeof REPAIR_TYPE_META]?.label ?? value,
			);
			filterParts.push(`Type: ${typeLabels.join(", ")}`);
		}

		const priorityFilter = table.getColumn("priority")?.getFilterValue() as string[] | undefined;
		if (priorityFilter?.length) {
			const priorityLabels = priorityFilter.map(
				(value) => REPAIR_PRIORITY_META[value as keyof typeof REPAIR_PRIORITY_META]?.label ?? value,
			);
			filterParts.push(`Priority: ${priorityLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) => REPAIR_STATUS_META[value as keyof typeof REPAIR_STATUS_META]?.label ?? value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const filterText = filterParts.length ? filterParts.join(" | ") : "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("repairs", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "repairs",
						title: "Repairs Report",
						filters: filterText,
						headers: ["Repair ID", "Unit", "Title", "Type", "Priority", "Status", "Description", "Created", "Updated"],
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
						summary: [{ metric: "Repairs in scope", value: `${exportRows.length}` }],
					})
				}
			/>
		);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={repairs}
					columns={columns}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
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
