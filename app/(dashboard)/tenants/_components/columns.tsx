"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	MoreHorizontal,
	Phone,
	IdCard,
	Send,
	Eye,
	Edit,
	Trash2,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ListTenantOutput } from "@/app/schemas/tenant.schema";
import { DeleteTenantModal } from "./delete-tenant-modal";
import { EditTenantModal } from "./edit-tenant-modal";
import Link from "next/link";
import { Role } from "@/types/role";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
	TENANT_PORTAL_META,
	TENANT_STATUS_META,
} from "@/config/table-facet-meta";

export const columns = (
	role: Role,
): ColumnDef<ListTenantOutput["items"][number]>[] => [
	// Name
	{
		id: "name",
		accessorFn: (row) =>
			`${row.firstName} ${row.lastName ?? ""} ${row.nickname ?? ""}`.trim(),

		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="User" />
		),

		cell: ({ row }) => {
			const user = row.original;

			return (
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<div className="flex flex-col">
							<span className="font-medium">
								{user.firstName} {user.lastName}
							</span>

							{user.nickname && (
								<span className="text-xs text-muted-foreground capitalize">
									{user.nickname}
								</span>
							)}
						</div>
					</TooltipTrigger>

					<TooltipContent sideOffset={6}>
						<div className="space-y-1 text-sm">
							{user.phoneNumber && (
								<div className="flex items-center gap-2">
									<Phone className="size-3.5" />
									<span>{user.phoneNumber}</span>
								</div>
							)}

							{user.nic && (
								<div className="flex items-center gap-2">
									<IdCard className="size-3.5" />
									<span>{user.nic}</span>
								</div>
							)}
						</div>
					</TooltipContent>
				</Tooltip>
			);
		},
	},
	{
		accessorFn: (row) => (row.userId ? "registered" : "not_registered"),
		id: "portal",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Portal" />
		),

		cell: ({ row }) => {
			const portal = row.original.userId ? "registered" : "not_registered";
			const config =
				TENANT_PORTAL_META[portal as keyof typeof TENANT_PORTAL_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2", config?.color)}>
					{Icon && <Icon className="size-4" />}
					{config?.label ?? portal.replace("_", " ")}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},
	// // NIC
	// {
	// 	accessorKey: "nic",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="NIC" />
	// 	),
	// },

	// // Phone
	// {
	// 	accessorKey: "phoneNumber",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="Phone" />
	// 	),
	// },

	// Status
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),

		cell: ({ row }) => {
			const status = row.original.status;
			const config =
				TENANT_STATUS_META[status as keyof typeof TENANT_STATUS_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2", config?.color)}>
					{Icon && <Icon className="size-4" />}
					{config?.label ?? status}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Created
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Created" />
		),

		cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
	},

	// Actions
	{
		id: "actions",

		cell: ({ row }) => {
			const user = row.original;
			const canManageTenant =
				role !== "tenant" && !["evicted", "inactive"].includes(user.status);

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="size-8 p-0">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>

						<DropdownMenuSeparator />

						<Link href={`/tenants/${user.id}`}>
							<DropdownMenuItem>
								<Users className="mr-2 size-4 text-foreground" />
								View Tenant
							</DropdownMenuItem>
						</Link>

						{canManageTenant && (
							<>
								<EditTenantModal data={user}>
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<Edit className="mr-2 size-4" />
										Edit Tenant
									</DropdownMenuItem>
								</EditTenantModal>

								<DropdownMenuItem>
									<Send className="mr-2 size-4" />
									Send Invitation
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DeleteTenantModal
									tenantId={user.id}
									tenantName={user.firstName}
								>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										className="text-destructive "
									>
										<Trash2 className="mr-2 size-4 text-destructive" />
										Delete Tenant
									</DropdownMenuItem>
								</DeleteTenantModal>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
