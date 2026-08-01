"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

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
	Eye,
	MoreHorizontal,
	Receipt,
	ReceiptText,
	RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ListPaymentOutput } from "@/app/schemas/payment.schema";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
	PAYMENT_METHOD_META,
	PAYMENT_TYPE_META,
} from "@/config/table-facet-meta";

export const columns: ColumnDef<ListPaymentOutput["items"][number]>[] = [
	// Payment ID
	{
		accessorKey: "id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Payment ID" />
		),
	},

	// Lease ID
	{
		accessorKey: "leaseId",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Lease" />
		),
		cell: ({ row }) => (
			<span className="font-medium">#{row.original.leaseId}</span>
		),
	},

	// Payment Type
	{
		accessorKey: "paymentType",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Payment Type" />
		),
		cell: ({ row }) => {
			const type = row.original.paymentType;
			const config = PAYMENT_TYPE_META[type as keyof typeof PAYMENT_TYPE_META];
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

	// Payment Method
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
		cell: ({ row }) => (
			<div className="text-right font-medium">
				{new Intl.NumberFormat("en-LK", {
					style: "currency",
					currency: "LKR",
				}).format(row.original.paymentAmount)}
			</div>
		),
	},

	// Description
	{
		accessorKey: "description",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Description" />
		),
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{row.original.description ?? "-"}
			</span>
		),
	},

	// Actions
	{
		id: "actions",
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="size-8 p-0">
						<MoreHorizontal className="size-4" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>

					<DropdownMenuSeparator />

					<DropdownMenuItem>
						<ReceiptText className="mr-2 size-4" />
						Generate Receipt
					</DropdownMenuItem>

					<Link href={`/leases/${row.original.leaseId}`}>
						<DropdownMenuItem>
							<RotateCcw className="mr-2 size-4" />
							View History
						</DropdownMenuItem>
					</Link>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];
