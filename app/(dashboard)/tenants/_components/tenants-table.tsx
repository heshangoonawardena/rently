"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import { Role } from "@/types/role";
import {
	TENANT_PORTAL_FILTER_OPTIONS,
	TENANT_PORTAL_META,
	TENANT_STATUS_FILTER_OPTIONS,
	TENANT_STATUS_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatExportDate } from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import type { ListTenantOutput } from "@/app/schemas/tenant.schema";
import type { Table } from "@tanstack/react-table";

type TenantsTableProps = {
	role: Role;
};

export default function TenantsTable({ role }: TenantsTableProps) {
	const {
		data: { items: tenants },
	} = useSuspenseQuery(orpc.tenant.list.queryOptions({ input: {} }));

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
			status: TENANT_STATUS_META[tenant.status as keyof typeof TENANT_STATUS_META]?.label ?? tenant.status,
			phone: tenant.phoneNumber ?? "-",
			nic: tenant.nic ?? "-",
			createdAt: formatExportDate(tenant.createdAt.toString()),
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();
		if (globalSearch) filterParts.push(`Search: ${globalSearch}`);

		const portalFilter = table.getColumn("portal")?.getFilterValue() as string[] | undefined;
		if (portalFilter?.length) {
			const portalLabels = portalFilter.map(
				(value) => TENANT_PORTAL_META[value as keyof typeof TENANT_PORTAL_META]?.label ?? value,
			);
			filterParts.push(`Portal: ${portalLabels.join(", ")}`);
		}

		const statusFilter = table.getColumn("status")?.getFilterValue() as string[] | undefined;
		if (statusFilter?.length) {
			const statusLabels = statusFilter.map(
				(value) => TENANT_STATUS_META[value as keyof typeof TENANT_STATUS_META]?.label ?? value,
			);
			filterParts.push(`Status: ${statusLabels.join(", ")}`);
		}

		const filterText = filterParts.length ? filterParts.join(" | ") : "All records";

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
						summary: [{ metric: "Tenants in scope", value: `${exportRows.length}` }],
					})
				}
			/>
		);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={tenants}
					columns={columns(role)}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
				/>
			</CardContent>
		</Card>
	);
}
