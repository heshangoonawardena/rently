"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	MoreHorizontal,
	Edit,
	Trash2,
	CheckCircle2,
	CalendarClock,
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

import type { ListInspectionOutput } from "@/app/schemas/inspection.schema";
import Link from "next/link";
import { Role } from "@/types/role";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { INSPECTION_STATUS_META } from "@/config/table-facet-meta";
import { MarkInspectionDoneModal } from "@/components/inspection-overview-card/mark-inspection-done-modal";
import { DeleteInspectionModal } from "@/components/inspection-overview-card/delete-inspection-modal";
import { EditInspectionModal } from "@/components/inspection-overview-card/edit-inspection-modal";

export const columns = (
	role: Role,
): ColumnDef<ListInspectionOutput["items"][number]>[] => [
	{
		accessorKey: "title",

		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),

		cell: ({ row }) => {
			const inspection = row.original;

			return (
				<div className="flex flex-col">
					<span className="font-medium">{inspection.title}</span>
					{inspection.description && (
						<span className="text-xs text-muted-foreground line-clamp-1">
							{inspection.description}
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "unitId",
		id: "unit",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Unit" />
		),

		cell: ({ row }) => {
			const inspection = row.original;

			return (
				<Badge variant="outline" className={cn("gap-1 pl-2")}>
					<Link
						href={`/units/${inspection.unitId}`}
						className="hover:underline"
					>
						Unit {inspection.unitId}
					</Link>
				</Badge>
			);
		},
	},
	{
		accessorKey: "scheduledDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Scheduled" />
		),

		cell: ({ row }) =>
			new Date(row.original.scheduledDate).toLocaleDateString(),
	},
	{
		accessorKey: "completedDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Completed" />
		),

		cell: ({ row }) => {
			const completedDate = row.original.completedDate;
			return completedDate
				? new Date(completedDate).toLocaleDateString()
				: "Pending";
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),

		cell: ({ row }) => {
			const status = row.original.status;
			const config =
				INSPECTION_STATUS_META[status as keyof typeof INSPECTION_STATUS_META];
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
			const inspection = row.original;

			const isNotTenant = role !== "tenant";

			const canEditInspection =
				isNotTenant &&
				!["cancelled", "completed", "rescheduled", "skipped"].includes(inspection.status);

			const canCompleteInspection =
				isNotTenant && ["scheduled", "rescheduled"].includes(inspection.status);

			const canDeleteInspection = ["scheduled", "rescheduled"].includes(
				inspection.status,
			);

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

						<Link href={`/units/${inspection.unitId}`}>
							<DropdownMenuItem>
								<CalendarClock className="mr-2 size-4" />
								View Unit
							</DropdownMenuItem>
						</Link>

						{canEditInspection && (
							<EditInspectionModal inspection={inspection}>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<Edit className="mr-2 size-4" />
									Edit Inspection
								</DropdownMenuItem>
							</EditInspectionModal>
						)}

						{canCompleteInspection && (
							<MarkInspectionDoneModal inspection={inspection}>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<CheckCircle2 className="mr-2 size-4" />
									Mark as Done
								</DropdownMenuItem>
							</MarkInspectionDoneModal>
						)}

						{canDeleteInspection && (
							<>
								<DropdownMenuSeparator />
								<DeleteInspectionModal inspectionId={inspection.id}>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										className="text-destructive"
									>
										<Trash2 className="mr-2 size-4 text-destructive" />
										Cancel Inspection
									</DropdownMenuItem>
								</DeleteInspectionModal>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
