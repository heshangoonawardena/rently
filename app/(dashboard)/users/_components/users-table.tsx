"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import { columns } from "./columns";

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
	} = useSuspenseQuery(orpc.user.list.queryOptions({ input: {} }));

	return (
		<Card>
			<CardContent>
				<DataTable data={items} columns={columns} facetedFilters={facetedFilters} />
			</CardContent>
		</Card>
	);
}
