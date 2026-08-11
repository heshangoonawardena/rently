"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const DEFAULT_PAGE_SIZE = 10;

import {
	PAYMENT_METHOD_FILTER_OPTIONS,
	PAYMENT_TYPE_FILTER_OPTIONS,
} from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";
import { columns } from "./columns";

type LeasePaymentsTableProps = {
	leaseId: number;
};

export default function LeasePaymentsTable({
	leaseId,
}: LeasePaymentsTableProps) {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([]);
	const [currentCursor, setCurrentCursor] = useState<number | null>(null);
	const {
		data: { items: payments, nextCursor },
	} = useSuspenseQuery(
		orpc.payment.list.queryOptions({
			input: {
				leaseId,
				limit: pageSize,
				cursor: currentCursor ?? undefined,
			},
		}),
	);

	const handlePageSizeChange = (nextPageSize: number) => {
		setPageSize(nextPageSize);
		setCursorHistory([]);
		setCurrentCursor(null);
	};

	const handlePreviousPage = () => {
		setCursorHistory((history) => {
			if (history.length === 0) return history;
			const nextHistory = history.slice(0, -1);
			setCurrentCursor(history[history.length - 1]);
			return nextHistory;
		});
	};

	const handleNextPage = () => {
		if (nextCursor === null) return;

		setCursorHistory((history) => [...history, currentCursor]);
		setCurrentCursor(nextCursor);
	};

	const incomingTotal = payments
		.filter(
			(payment) =>
				!["refund", "deposit_deduction"].includes(payment.paymentType),
		)
		.reduce((sum, payment) => sum + Number(payment.paymentAmount), 0);

	const outgoingTotal = payments
		.filter((payment) =>
			["refund", "deposit_deduction"].includes(payment.paymentType),
		)
		.reduce((sum, payment) => sum + Number(payment.paymentAmount), 0);

	const netTotal = incomingTotal - outgoingTotal;

	const latestPaymentDate =
		payments.length > 0
			? new Date(
					Math.max(
						...payments.map((payment) =>
							new Date(payment.paymentDate).getTime(),
						),
					),
				)
			: null;

	const facetedFilters = [
		{
			title: "Payment Type",
			columnId: "paymentType",
			options: PAYMENT_TYPE_FILTER_OPTIONS,
		},
		{
			title: "Method",
			columnId: "paymentMethod",
			options: PAYMENT_METHOD_FILTER_OPTIONS,
		},
	];

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle>Payments Overview</CardTitle>
					<CardDescription>All payments of the lease</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Total Payments</p>
						<p className="text-lg font-semibold">{payments.length}</p>
					</div>
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Net Amount</p>
						<p className="text-lg font-semibold">
							LKR {netTotal.toLocaleString()}
						</p>
					</div>
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Incoming</p>
						<p className="text-lg font-semibold text-chart-2">
							LKR {incomingTotal.toLocaleString()}
						</p>
					</div>
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Latest Payment</p>
						<p className="text-sm font-medium">
							{latestPaymentDate
								? latestPaymentDate.toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})
								: "-"}
						</p>
					</div>
				</div>

				<DataTable
					data={payments}
					columns={columns}
					facetedFilters={facetedFilters}
					pagination={{
						mode: "cursor",
						currentPage: cursorHistory.length + 1,
						pageSize,
						canPreviousPage: cursorHistory.length > 0,
						canNextPage: nextCursor !== null,
						onPageSizeChange: handlePageSizeChange,
						onPreviousPage: handlePreviousPage,
						onNextPage: handleNextPage,
					}}
				/>
			</CardContent>
		</Card>
	);
}
