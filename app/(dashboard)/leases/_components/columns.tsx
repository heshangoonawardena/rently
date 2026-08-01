"use client";

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
import {
	Edit,
	Eye,
	Handshake,
	MoreHorizontal,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ListLeaseOutput } from "@/app/schemas/lease.schema";
import { EndLeaseModal } from "./end-lease-modal";
import { EditLeaseModal } from "./edit-lease-modal";
import { RenewLeaseModal } from "./renew-lease-modal";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
	LEASE_STATUS_META,
	UNIT_TYPE_META,
	UTILITY_BILLING_MODE_META,
} from "@/config/table-facet-meta";
import { Role } from "@/types/role";

export type Payment = {
	id: string;
	amount: number;
	status: "pending" | "processing" | "success" | "failed";
	email: string;
};

export const columns = (
	role: Role,
): ColumnDef<ListLeaseOutput["items"][number]>[] => [
	// Unit
	{
		id: "unit",

		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Unit" />
		),
		cell: ({ row }) => {
			const { unit } = row.original;
			const config = UNIT_TYPE_META[unit.type as keyof typeof UNIT_TYPE_META];
			const Icon = config?.icon;

			return (
				<div className="flex flex-col">
					<div className="flex items-center gap-2 font-medium">
						{Icon && <Icon className="size-4 text-muted-foreground" />}
					</div>
					<span className="text-xs text-muted-foreground capitalize">
						{unit.name}
					</span>
				</div>
			);
		},
	},

	// Tenant
	// add contact details to tooltip
	{
		id: "tenant",
		accessorFn: (row) =>
			`${row.tenant.firstName} ${row.tenant.lastName ?? ""} ${row.tenant.nickname ?? ""}`.trim(),
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tenant" />
		),
		cell: ({ row }) => {
			const { tenant } = row.original;
			const { phoneNumber } = row.original.tenant;
			const { nic } = row.original.tenant;

			return (
				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<div className="flex flex-col justify-center">
							<span className="font-medium">
								{tenant.firstName} {tenant?.lastName}
							</span>

							{tenant.nickname && role !== "tenant" && (
								<span className="text-xs text-muted-foreground capitalize">
									{tenant.nickname}
								</span>
							)}
						</div>
					</TooltipTrigger>

					<TooltipContent sideOffset={6}>
						<div>
							{phoneNumber && (
								<p className="max-w-xs warp-break-words">{phoneNumber}</p>
							)}
							{nic && <p className="max-w-xs warp-break-words">{nic}</p>}
						</div>
					</TooltipContent>
				</Tooltip>
			);
		},
	},

	// Rent
	{
		id: "rent",
		accessorFn: (row) => row.currentRent?.rentAmount,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Rent" />
		),
		cell: ({ row }) => (
			<div className="text-right font-medium">
				{new Intl.NumberFormat("en-LK", {
					style: "currency",
					currency: "LKR",
				}).format(row.original.currentRent?.rentAmount ?? 0)}
			</div>
		),
	},

	// Lease Period
	{
		id: "leasePeriod",
		accessorFn: (row) => `${row.startDate} ${row.endDate ?? ""}`.trim(),
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Lease Period" />
		),
		cell: ({ row }) => {
			const { startDate, endDate } = row.original;
			const start = new Date(startDate);

			if (!endDate) {
				return (
					<div>
						<div>
							{start.toLocaleDateString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
							})}{" "}
							– <span className="text-muted-foreground">Ongoing</span>
						</div>
						<div className="text-xs text-muted-foreground">No end date</div>
					</div>
				);
			}

			const end = new Date(endDate);
			const today = new Date();

			start.setHours(0, 0, 0, 0);
			end.setHours(0, 0, 0, 0);
			today.setHours(0, 0, 0, 0);

			const days = Math.ceil(
				(end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
			);

			let color = "text-green-600";

			if (days <= 30) color = "text-orange-500";
			if (days <= 7) color = "text-red-500";
			if (days < 0) color = "text-muted-foreground";

			return (
				<div>
					<div>
						{start.toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}{" "}
						–{" "}
						{end.toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}
					</div>

					<div className={cn("text-xs", color)}>
						{days >= 0
							? `${days} day${days !== 1 ? "s" : ""} left`
							: `Expired ${Math.abs(days)} day${
									Math.abs(days) !== 1 ? "s" : ""
								} ago`}
					</div>
				</div>
			);
		},
	},

	// Deposit
	{
		accessorKey: "depositAmount",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Deposit" />
		),
		cell: ({ row }) => (
			<div className="text-right">
				{new Intl.NumberFormat("en-LK", {
					style: "currency",
					currency: "LKR",
				}).format(Number(row.original.depositAmount))}
			</div>
		),
	},

	// Billing
	{
		id: "utilityBilling",
		accessorFn: (row) => row.unit.utilityBillingMode,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Utility Billing Method" />
		),
		cell: ({ row }) => (
			<Badge variant="outline" className="gap-1 pl-2">
				{(() => {
					const mode = row.original.unit.utilityBillingMode;
					const config =
						UTILITY_BILLING_MODE_META[
							mode as keyof typeof UTILITY_BILLING_MODE_META
						];
					const Icon = config?.icon;

					return (
						<>
							{Icon && <Icon className="size-4" />}
							{config?.label ?? mode.replace("_", " ")}
						</>
					);
				})()}
			</Badge>
		),
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Lease Status
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.original.status;
			const config =
				LEASE_STATUS_META[status as keyof typeof LEASE_STATUS_META];
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

	// Actions
	{
		id: "actions",
		cell: ({ row }) => {
			const lease = row.original;
			const createdAtMs = new Date(lease.createdAt).getTime();
			const isEditLocked =
				Number.isFinite(createdAtMs) &&
				Date.now() - createdAtMs > 10 * 60 * 1000;

			const canManageLease =
				role !== "tenant" && ["active", "extended"].includes(lease.status);

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

						<Link href={`/leases/${lease.id}`}>
							<DropdownMenuItem>
								<Handshake className="mr-2 size-4" />
								View Lease
							</DropdownMenuItem>
						</Link>

						{canManageLease && (
							<>
								{isEditLocked ? (
									<DropdownMenuItem disabled>
										<Edit className="mr-2 size-4" />
										Edit Lease
									</DropdownMenuItem>
								) : (
									<EditLeaseModal data={lease}>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<Edit className="mr-2 size-4" />
											Edit Lease
										</DropdownMenuItem>
									</EditLeaseModal>
								)}

								<RenewLeaseModal data={lease}>
									<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
										<RefreshCw className="mr-2 size-4" />
										Renew Lease
									</DropdownMenuItem>
								</RenewLeaseModal>

								<DropdownMenuSeparator />

								<EndLeaseModal id={lease.id}>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										className="text-destructive"
									>
										<Trash2 className="mr-2 size-4 text-destructive" />
										Delete Lease
									</DropdownMenuItem>
								</EndLeaseModal>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
