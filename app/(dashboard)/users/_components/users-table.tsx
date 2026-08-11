"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
// import { useState } from "react";
import type { ListUsersOutput } from "@/app/schemas/user.schema";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card, CardContent } from "@/components/ui/card";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import { columns } from "./columns";

// const DEFAULT_PAGE_SIZE = 10;

const facetedFilters = [
	{
		title: "Access",
		columnId: "approvalStatus",
		options: [
			{ label: "Pending Approval", value: "pending_approval" },
			{ label: "Approved", value: "approved" },
		],
	},
	{
		title: "Role",
		columnId: "role",
		options: [
			{ label: "Owner", value: "owner" },
			{ label: "Manager", value: "manager" },
			{ label: "Tenant", value: "tenant" },
			{ label: "Unassigned", value: "unassigned" },
		],
	},
];

export default function UsersTable() {
	const {
		data: { items },
	} = useSuspenseQuery(
		orpc.user.list.queryOptions({
			input: {},
		}),
	);

	type UserRow = ListUsersOutput["items"][number];

	const renderToolbarActions = (table: Table<UserRow>) => {
		const exportRows = table
			.getSortedRowModel()
			.rows.map(({ original: item }) => ({
				name: item.name,
				email: item.email,
				access:
					item.approvalStatus === "approved" ? "Approved" : "Pending Approval",
				role: item.role ?? "unassigned",
				tenant: item.tenantName ?? "-",
				signedUpAt: new Date(item.createdAt).toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				}),
				lastLoggedInAt: item.lastLoggedInAt
					? new Date(item.lastLoggedInAt).toLocaleString(undefined, {
							year: "numeric",
							month: "short",
							day: "2-digit",
							hour: "2-digit",
							minute: "2-digit",
						})
					: "-",
			}));

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("users", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "users",
						title: "Users Report",
						filters: "Current user table scope",
						headers: [
							"Name",
							"Email",
							"Access",
							"Role",
							"Assigned Tenant",
							"Signed Up",
							"Last Login",
						],
						rows: exportRows.map((row) => [
							row.name,
							row.email,
							row.access,
							row.role,
							row.tenant,
							row.signedUpAt,
							row.lastLoggedInAt,
						]),
						summary: [
							{
								metric: "Users in scope",
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
					data={items}
					columns={columns}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
				/>
			</CardContent>
		</Card>
	);
}
