"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	Building,
	ChevronDown,
	Edit,
	MoreHorizontal,
	RotateCcw,
} from "lucide-react";
import Link from "next/link";
import type { ListRepairRequestOutput } from "@/app/schemas/repair.request.schema";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Badge } from "@/components/ui/badge";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	REPAIR_PRIORITY_META,
	REPAIR_STATUS_META,
	REPAIR_TYPE_META,
} from "@/config/table-facet-meta";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/role";
import AddRepairReopenModal from "./add-repair-reopen-modal copy";
import { EditRepairRequestModal } from "./edit-repair-modal";

export const columns = (
	role: Role,
): ColumnDef<ListRepairRequestOutput["items"][number]>[] => [
	// Expander
	{
		id: "expander",
		header: () => null,
		cell: ({ row }) => (
			<Button
				variant="ghost"
				className="p-0 size-8"
				onClick={row.getToggleExpandedHandler()}
			>
				<ChevronDown
					className={cn(
						"size-4 transition-transform",
						row.getIsExpanded() ? "-rotate-180" : "",
					)}
				/>
			</Button>
		),
	},
	// Repair ID
	{
		accessorKey: "id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Repair ID" />
		),
	},

	// Unit
	{
		accessorKey: "unitId",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Unit" />
		),
		cell: ({ row }) => (
			<span className="font-medium">#{row.original.unitId}</span>
		),
	},

	// Title
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),
		cell: ({ row }) => (
			<span className="font-medium">{row.original.title}</span>
		),
	},

	// Repair Type
	{
		accessorKey: "repairType",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Type" />
		),
		cell: ({ row }) => {
			const type = row.original.repairType;
			const config = REPAIR_TYPE_META[type as keyof typeof REPAIR_TYPE_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2", config?.color)}>
					{Icon && <Icon className="size-4" />}
					{config?.label ?? type.replaceAll("_", " ")}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Priority
	{
		accessorKey: "priority",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Priority" />
		),
		cell: ({ row }) => {
			const priority = row.original.priority;
			const config =
				REPAIR_PRIORITY_META[priority as keyof typeof REPAIR_PRIORITY_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2", config?.color)}>
					{Icon && <Icon className="size-4" />}
					{config?.label ?? priority}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Status
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.original.status;
			const config =
				REPAIR_STATUS_META[status as keyof typeof REPAIR_STATUS_META];
			const Icon = config?.icon;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2", config?.color)}>
					{Icon && <Icon className="size-4" />}
					{config?.label ?? status.replaceAll("_", " ")}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Description
	{
		accessorKey: "description",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Description" />
		),
		cell: ({ row }) => {
			const description = row.original.description ?? "no comments";

			return (
				<Tooltip delayDuration={400}>
					<TooltipTrigger asChild>
						<span className="text-foreground truncate max-w-50 inline-block cursor-default">
							{description}
						</span>
					</TooltipTrigger>

					<TooltipContent sideOffset={6}>
						<p className="max-w-xs warp-break-words">{description}</p>
					</TooltipContent>
				</Tooltip>
			);
		},
	},

	// Created
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Created" />
		),
		cell: ({ row }) =>
			new Date(row.original.createdAt).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
	},

	// Last Updated
	{
		accessorKey: "updatedAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Updated" />
		),
		cell: ({ row }) =>
			new Date(row.original.updatedAt).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
	},
	// Actions
	{
		id: "actions",
		cell: ({ row }) => {
			const isNotTenant = role !== "tenant";

			const repair = row.original;
			const createdAtMs = new Date(repair.createdAt).getTime();
			const isResolved = row.original.status === "resolved";
			const isEditLocked =
				Number.isFinite(createdAtMs) &&
				Date.now() - createdAtMs > 10 * 60 * 1000;

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

						{isEditLocked ? (
							<DropdownMenuItem disabled>
								<Edit className="mr-2 size-4" />
								Edit Request
							</DropdownMenuItem>
						) : (
							<EditRepairRequestModal data={repair}>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<Edit className="mr-2 size-4" />
									Edit Request
								</DropdownMenuItem>
							</EditRepairRequestModal>
						)}
						{isResolved && (
							<AddRepairReopenModal
								repairRequestId={repair.id}
								currentStatus="resolved"
							>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<RotateCcw className="mr-2 size-4" />
									Reopen Request
								</DropdownMenuItem>
							</AddRepairReopenModal>
						)}

						{isNotTenant && (
							<Link href={`/units/${repair.unitId}`}>
								<DropdownMenuItem>
									<Building className="mr-2 size-4" />
									View Unit
								</DropdownMenuItem>
							</Link>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
