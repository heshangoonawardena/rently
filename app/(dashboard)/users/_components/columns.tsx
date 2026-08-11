"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck } from "lucide-react";
import type { ListUsersOutput } from "@/app/schemas/user.schema";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApproveUserModal } from "./approve-user-modal";
import { ManageUserActions } from "./manage-user-actions";

type UserRow = ListUsersOutput["items"][number];

const statusMeta = {
	pending_approval: {
		label: "Pending Approval",
		color: "text-foreground border-border bg-muted/40",
	},
	approved: {
		label: "Approved",
		color: "text-foreground border-border bg-muted/40",
	},
} as const;

const roleMeta = {
	owner: {
		label: "Owner",
		color: "text-foreground border-border bg-muted/40",
	},
	manager: {
		label: "Manager",
		color: "text-foreground border-border bg-muted/40",
	},
	tenant: {
		label: "Tenant",
		color: "text-foreground border-border bg-muted/40",
	},
	unassigned: {
		label: "Unassigned",
		color: "text-muted-foreground border-border bg-muted/20",
	},
} as const;

export const columns: ColumnDef<UserRow>[] = [
	{
		id: "name",
		accessorFn: (row) => `${row.name} ${row.email}`,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="User" />
		),
		cell: ({ row }) => {
			const user = row.original;

			return (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{user.name}</span>
					<span className="text-xs text-muted-foreground">{user.email}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "approvalStatus",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Access" />
		),
		cell: ({ row }) => {
			const status = row.original.approvalStatus;
			const config = statusMeta[status];
			return (
				<Badge variant="outline" className={cn("gap-1", config.color)}>
					{config.label}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},
	{
		id: "role",
		accessorFn: (row) => row.role ?? "unassigned",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Role" />
		),
		cell: ({ row }) => {
			const role = row.original.role ?? "unassigned";
			const config =
				roleMeta[role as keyof typeof roleMeta] ?? roleMeta.unassigned;

			return (
				<Badge variant="outline" className={cn("gap-1", config.color)}>
					{config.label}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},
	{
		id: "tenant",
		accessorFn: (row) => row.tenantName ?? "-",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Assigned Tenant" />
		),
		cell: ({ row }) => <span>{row.original.tenantName ?? "-"}</span>,
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Signed Up" />
		),
		cell: ({ row }) =>
			new Date(row.original.createdAt).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
	},
	{
		id: "lastLoggedInAt",
		accessorFn: (row) => row.lastLoggedInAt,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Last Login" />
		),
		cell: ({ row }) => {
			const value = row.original.lastLoggedInAt;
			if (!value) {
				return "-";
			}

			return new Date(value).toLocaleString(undefined, {
				year: "numeric",
				month: "short",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const user = row.original;

			if (user.approvalStatus === "approved") {
				return <ManageUserActions user={user} />;
			}

			return (
				<ApproveUserModal user={user}>
					<Button variant="outline" size="sm">
						<ShieldCheck className="mr-2 size-4" />
						Review & Approve
					</Button>
				</ApproveUserModal>
			);
		},
	},
];
