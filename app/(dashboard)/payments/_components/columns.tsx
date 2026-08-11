"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download, MoreHorizontal, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { ListPaymentOutput } from "@/app/schemas/payment.schema";
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
	PAYMENT_METHOD_META,
	PAYMENT_TYPE_META,
} from "@/config/table-facet-meta";
import { downloadPaymentReceipt } from "@/lib/exports/payment-receipt";
import { getClientSession } from "@/lib/get-client";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

function PaymentActions({
	payment,
}: {
	payment: ListPaymentOutput["items"][number];
}) {
	const { data: session } = getClientSession();
	const generatedBy =
		session?.user?.name ?? session?.user?.email ?? "Rently system";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="size-8 p-0">
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>

				<DropdownMenuItem
					onClick={() => {
						downloadPaymentReceipt(payment, generatedBy);
					}}
				>
					<Download className="mr-2 size-4" />
					Download Receipt
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<Link href={`/leases/${payment.leaseId}`}>
					<DropdownMenuItem>
						<RotateCcw className="mr-2 size-4" />
						View History
					</DropdownMenuItem>
				</Link>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export const columns: ColumnDef<ListPaymentOutput["items"][number]>[] = [
	// Payment ID
	// {
	// 	accessorKey: "id",
	// 	header: ({ column }) => (
	// 		<DataTableColumnHeader column={column} title="Payment ID" />
	// 	),
	// },

	// Receipt Number
	{
		accessorKey: "receiptNumber",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Receipt No" />
		),
		cell: ({ row }) => (
			<span className="font-mono text-xs">
				{/* {row.original.receiptNumber ?? `PAY-${row.original.id}`} */}
				{row.original.receiptNumber}
			</span>
		),
	},

	// Lease Details
	{
		id: "leaseSummary",
		accessorFn: (row) =>
			row.leaseSummary
				? `${row.leaseSummary.unitName} ${row.leaseSummary.tenantName}`
				: `${row.leaseId}`,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Lease Details" />
		),
		cell: ({ row }) => {
			const leaseSummary = row.original.leaseSummary;

			if (!leaseSummary) {
				return (
					<span className="font-medium">Lease #{row.original.leaseId}</span>
				);
			}

			return (
				<div className="space-y-1">
					<p className="font-medium">{leaseSummary.unitName}</p>
					<p className="text-xs text-muted-foreground">
						Lease #{row.original.leaseId} • {leaseSummary.tenantName}
					</p>
					<p className="text-xs text-muted-foreground line-clamp-1">
						{leaseSummary.unitAddress}
					</p>
				</div>
			);
		},
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
			<DataTableColumnHeader column={column} title="Payment Method" />
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

	// Actions
	{
		id: "actions",
		cell: ({ row }) => <PaymentActions payment={row.original} />,
	},
];
