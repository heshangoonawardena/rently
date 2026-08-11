"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	CalendarClock,
	CheckCircle2,
	Edit,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import type { ListInspectionOutput } from "@/app/schemas/inspection.schema";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { DeleteInspectionModal } from "@/components/inspection-overview-card/delete-inspection-modal";
import { EditInspectionModal } from "@/components/inspection-overview-card/edit-inspection-modal";
import { MarkInspectionDoneModal } from "@/components/inspection-overview-card/mark-inspection-done-modal";
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
import { INSPECTION_STATUS_META } from "@/config/table-facet-meta";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/role";

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
				<Link href={`/units/${inspection.unitId}`}>
					<Badge variant="outline" className={cn("gap-1 pl-2")}>
						Unit {inspection.unitId}
					</Badge>
				</Link>
			);
		},
	},
	{
		accessorKey: "scheduledDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Scheduled" />
		),

		cell: ({ row }) => {
			const scheduledDate = new Date(row.original.scheduledDate);
			const showRemainingText = ["scheduled", "rescheduled"].includes(
				row.original.status,
			);

			// Compare dates without time
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const scheduled = new Date(scheduledDate);
			scheduled.setHours(0, 0, 0, 0);

			const diffTime = scheduled.getTime() - today.getTime();
			const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			let remainingText: string;
			let remainingClassName = "text-muted-foreground";

			if (remainingDays === 0) {
				remainingText = "Today";
				remainingClassName = "text-chart-1";
			} else if (remainingDays > 0) {
				remainingText = `${remainingDays} ${
					remainingDays === 1 ? "day" : "days"
				} remaining`;
				remainingClassName = "text-chart-3";
			} else {
				const overdueDays = Math.abs(remainingDays);

				remainingText = `${overdueDays} ${
					overdueDays === 1 ? "day" : "days"
				} overdue`;
				remainingClassName = "text-chart-1";
			}

			return (
				<div className="flex flex-col">
					<span>
						{new Date(scheduledDate).toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}
					</span>

					<span className={cn("text-xs", remainingClassName)}>
						{showRemainingText && remainingText}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "completedDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Completed" />
		),

		cell: ({ row }) => {
			const completedDate = row.original.completedDate;
			const showPending = ["scheduled", "rescheduled"].includes(
				row.original.status,
			);

			return completedDate
				? new Date(completedDate).toLocaleDateString()
				: showPending
					? "Pending"
					: "-";
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

		cell: ({ row }) =>
			new Date(row.original.createdAt).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
	},

	// Actions
	{
		id: "actions",

		cell: ({ row }) => {
			const inspection = row.original;

			const isNotTenant = role !== "tenant";

			const canEditInspection =
				isNotTenant &&
				!["cancelled", "completed", "rescheduled", "skipped"].includes(
					inspection.status,
				);

			const canCompleteInspection =
				isNotTenant && ["scheduled", "rescheduled"].includes(inspection.status);

			const canDeleteInspection =
				isNotTenant && ["scheduled", "rescheduled"].includes(inspection.status);

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

						{isNotTenant && (
							<Link href={`/units/${inspection.unitId}`}>
								<DropdownMenuItem>
									<CalendarClock className="mr-2 size-4" />
									View Unit
								</DropdownMenuItem>
							</Link>
						)}

						{canEditInspection && (
							<EditInspectionModal data={inspection}>
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
