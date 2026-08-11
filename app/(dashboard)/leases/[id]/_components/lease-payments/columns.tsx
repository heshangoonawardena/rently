"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { ListPaymentOutput } from "@/app/schemas/payment.schema";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import {
	PAYMENT_METHOD_META,
	PAYMENT_TYPE_META,
} from "@/config/table-facet-meta";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export const columns: ColumnDef<ListPaymentOutput["items"][number]>[] = [
	// Payment
	{
		id: "paymentType",
		accessorFn: (row) => row.paymentType,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Payment" />
		),
		cell: ({ row }) => {
			const type = row.original.paymentType;
			const typeConfig =
				PAYMENT_TYPE_META[type as keyof typeof PAYMENT_TYPE_META];
			const TypeIcon = typeConfig?.icon;

			return (
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className={cn("gap-1 pl-2", typeConfig?.color)}
						>
							{TypeIcon && <TypeIcon className="size-4" />}
							{typeConfig?.label ?? type.replaceAll("_", " ")}
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground">
						{row.original.receiptNumber}
					</p>
				</div>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Method
	{
		accessorKey: "paymentMethod",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Method" />
		),
		cell: ({ row }) => {
			const method = row.original.paymentMethod;
			const config =
				PAYMENT_METHOD_META[method as keyof typeof PAYMENT_METHOD_META];
			const Icon = config?.icon;

			return (
				<Badge variant="secondary" className="gap-1 pl-2 capitalize">
					{Icon && <Icon className="size-4" />}
					{config?.label ?? method.replaceAll("_", " ")}
				</Badge>
			);
		},
		filterFn: (row, id, value) => value.includes(row.getValue(id)),
	},

	// Paid For
	{
		id: "paidFor",
		accessorFn: (row) => row.periodStart,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Paid For" />
		),
		cell: ({ row }) => {
			const start = row.original.periodStart;
			const end = row.original.periodEnd;

			if (!start || !end) {
				return <span className="text-muted-foreground">-</span>;
			}

			return (
				<div className="flex items-center gap-2">
					<CalendarDays className="size-4 text-muted-foreground" />
					<div className="leading-tight">
						<p>{format(new Date(start), "MMM yyyy")}</p>
						<p className="text-xs text-muted-foreground">
							{format(new Date(start), "dd MMM")} -{" "}
							{format(new Date(end), "dd MMM")}
						</p>
					</div>
				</div>
			);
		},
	},

	// Payment Date
	{
		accessorKey: "paymentDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Payment Date" />
		),
		cell: ({ row }) =>
			new Date(row.original.paymentDate).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
	},

	// Amount
	{
		accessorKey: "paymentAmount",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Amount" />
		),
		cell: ({ row }) => {
			const isDebit = ["refund", "deposit_deduction"].includes(
				row.original.paymentType,
			);

			return (
				<div className="text-right">
					<p className={cn("font-semibold", isDebit && "text-chart-1")}>
						{new Intl.NumberFormat("en-LK", {
							style: "currency",
							currency: "LKR",
						}).format(row.original.paymentAmount)}
					</p>
					<p className="text-xs text-muted-foreground">
						{isDebit ? "Outgoing" : "Incoming"}
					</p>
				</div>
			);
		},
	},

	// Description
	{
		accessorKey: "description",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Notes" />
		),
		cell: ({ row }) => (
			<Tooltip delayDuration={400}>
				<TooltipTrigger asChild>
					<span className="text-foreground truncate max-w-50 inline-block cursor-default">
						{row.original.description}
					</span>
				</TooltipTrigger>

				<TooltipContent sideOffset={6}>
					<p className="max-w-xs warp-break-words">
						{row.original.description}
					</p>
				</TooltipContent>
			</Tooltip>
		),
	},
];
