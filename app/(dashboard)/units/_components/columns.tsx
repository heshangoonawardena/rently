"use client";

import { ListUnitOutput } from "@/app/schemas/unit.schema";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteUnitModal } from "./delete-unit-modal";
import Link from "next/link";
import { EditUnitModal } from "./edit-unit-modal";
import { Role } from "@/types/role";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
	UNIT_STATUS_META,
	UNIT_TYPE_META,
	UTILITY_BILLING_MODE_META,
} from "@/config/table-facet-meta";

export type Payment = {
	id: string;
	amount: number;
	status: "pending" | "processing" | "success" | "failed";
	email: string;
};

export const columns = (
	role: Role,
): ColumnDef<ListUnitOutput["items"][number]>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Unit" />
		),
	},
	{
		accessorKey: "type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Type" />
		),
		cell: ({ row }) => {
			const type = row.original.type;
			const config = UNIT_TYPE_META[type as keyof typeof UNIT_TYPE_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2")}>
					{Icon && <Icon className="size-4" />}
					<span className="text-xs">{type}</span>
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			const config = UNIT_STATUS_META[status as keyof typeof UNIT_STATUS_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2", config?.color)}>
					{Icon && <Icon className="size-4" />}
					<span className="text-xs">{status}</span>
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},
	{
		accessorKey: "address",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Address" />
		),
		cell: ({ row }) => {
			const address = row.original.address;

			return (
				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<span className="text-foreground truncate max-w-50 inline-block cursor-default">
							{address}
						</span>
					</TooltipTrigger>

					<TooltipContent sideOffset={6}>
						<p className="max-w-xs warp-break-words">{address}</p>
					</TooltipContent>
				</Tooltip>
			);
		},
	},
	{
		id: "tenant",
		accessorFn: (row) => {
			const tenant = row.activeLease?.tenant;

			return tenant
				? `${tenant.firstName} ${tenant.lastName ?? ""}`.trim()
				: "No tenant";
		},
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tenant" />
		),
		cell: ({ row }) => {
			const tenant = row.original.activeLease?.tenant;
			return tenant ? (
				`${tenant.firstName} ${tenant.lastName ?? ""}`.trim()
			) : (
				<div className="text-muted-foreground">No tenant</div>
			);
		},
	},
	{
		id: "utilityBilling",
		accessorFn: (row) => row.utilityBillingMode,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Billing Mode" />
		),
		cell: ({ row }) => {
			const activeLease = row.original.activeLease;
			const mode = row.original.utilityBillingMode;
			const config =
				mode &&
				UTILITY_BILLING_MODE_META[
					mode as keyof typeof UTILITY_BILLING_MODE_META
				];
			const Icon = config?.icon;
			return activeLease ? (
				<Badge variant="outline" className="gap-1 pl-2">
					{Icon && <Icon className="size-4" />}

					<span className="text-xs">{mode.replace("_", " ")}</span>
				</Badge>
			) : mode ? (
				<div className="text-muted-foreground flex items-center gap-1">
					{Icon && <Icon className="size-4" />}
					was ({mode.replace("_", " ")})
				</div>
			) : (
				<div className="text-muted-foreground">No tenant</div>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},
	{
		id: "rent",
		accessorFn: (row) => row.activeLease?.currentRent?.rentAmount,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Rent" />
		),

		cell: ({ row }) => {
			const rent = row.original.activeLease?.currentRent?.rentAmount;

			return rent ? (
				<div className="text-right">
					{new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "LKR",
					}).format(Number(rent))}
				</div>
			) : (
				<div className="text-muted-foreground text-right">No tenant</div>
			);
		},
	},
	{
		id: "leaseEnd",
		accessorFn: (row) => row.activeLease?.endDate,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Lease End" />
		),
		cell: ({ row }) => {
			const endDate = row.original.activeLease?.endDate;

			if (!endDate)
				return <div className="text-muted-foreground">No tenant</div>;

			const end = new Date(endDate);
			const today = new Date();

			end.setHours(0, 0, 0, 0);
			today.setHours(0, 0, 0, 0);

			const diffTime = end.getTime() - today.getTime();
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			let color = "text-chart-1";

			if (diffDays < 0)
				color = "text-chart-2"; // expired
			else if (diffDays <= 7)
				color = "text-chart-3"; // expiring soon
			else if (diffDays <= 30) color = "text-chart-4";

			return (
				<div>
					<div>{endDate}</div>
					<div className={cn("text-xs", color)}>
						expires in {diffDays >= 0 ? diffDays : Math.abs(diffDays)} days
						{diffDays < 0 ? " ago" : ""}
					</div>
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const unit = row.original;

			const canManageUnit =
				role !== "tenant" && !["inactive"].includes(unit.status);

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="size-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>

						<DropdownMenuSeparator />

						<Link href={`/units/${unit.id}`}>
							<DropdownMenuItem>
								<Building className="mr-2 size-4" />
								View Unit
							</DropdownMenuItem>
						</Link>

						{canManageUnit && (
							<>
								<EditUnitModal data={unit}>
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<Edit className="mr-2 size-4" />
										Edit Unit
									</DropdownMenuItem>
								</EditUnitModal>

								<DropdownMenuSeparator />

								<DeleteUnitModal unitId={unit.id} unitName={unit.name}>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										className="text-destructive "
									>
										<Trash2 className="mr-2 size-4 text-destructive" />
										Delete Unit
									</DropdownMenuItem>
								</DeleteUnitModal>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
