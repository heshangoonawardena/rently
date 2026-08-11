"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import type { ListTenantOutput } from "@/app/schemas/tenant.schema";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card, CardContent } from "@/components/ui/card";
import {
	TENANT_PORTAL_FILTER_OPTIONS,
	TENANT_PORTAL_META,
	TENANT_STATUS_FILTER_OPTIONS,
	TENANT_STATUS_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { formatExportDate } from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { columns } from "./columns";

const DEFAULT_PAGE_SIZE = 10;

type TenantsTableProps = {
	role: Role;
};

export default function TenantsTable({ role }: TenantsTableProps) {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([]);
	const [currentCursor, setCurrentCursor] = useState<number | null>(null);

	const {
		data: { items: tenants, nextCursor },
	} = useSuspenseQuery(
		orpc.tenant.list.queryOptions({
			input: {
				limit: pageSize,
				cursor: currentCursor ?? undefined,
			},
		}),
	);

	const facetedFilters = [
		{
			title: "Portal",
			columnId: "portal",
			options: TENANT_PORTAL_FILTER_OPTIONS,
		},
		{
			title: "Status",
			columnId: "status",
			options: TENANT_STATUS_FILTER_OPTIONS,
		},
	];

	type TenantRow = ListTenantOutput["items"][number];

	const renderToolbarActions = (table: Table<TenantRow>) => {
		const sortedRows = table.getSortedRowModel().rows;
		const exportRows = sortedRows.map(({ original: tenant }) => ({
			name: `${tenant.firstName} ${tenant.lastName ?? ""}`.trim(),
			portal: tenant.userId ? "Registered" : "Not Registered",
			status:
				TENANT_STATUS_META[tenant.status as keyof typeof TENANT_STATUS_META]
					?.label ?? tenant.status,
			phone: tenant.phoneNumber ?? "-",
			nic: tenant.nic ?? "-",
			createdAt: formatExportDate(tenant.createdAt.toString()),
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();
		if (globalSearch) filterParts.push(`Search: ${globalSearch}`);

		const portalFilter = table.getColumn("portal")?.getFilterValue() as
			| string[]
			| undefined;
		if (portalFilter?.length) {
			const portalLabels = portalFilter.map(
				(value) =>
					TENANT_PORTAL_META[value as keyof typeof TENANT_PORTAL_META]?.label ??
					value,
			);
			filterParts.push(`Portal: ${portalLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as
			| string[]
			| undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) =>
					TENANT_STATUS_META[value as keyof typeof TENANT_STATUS_META]?.label ??
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
				onCsv={() => exportCsv("tenants", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "tenants",
						title: "Tenants Report",
						filters: filterText,
						headers: ["Name", "Portal", "Status", "Phone", "NIC", "Created"],
						rows: exportRows.map((row) => [
							row.name,
							row.portal,
							row.status,
							row.phone,
							row.nic,
							row.createdAt,
						]),
						summary: [
							{ metric: "Tenants in scope", value: `${exportRows.length}` },
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
					data={tenants}
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
