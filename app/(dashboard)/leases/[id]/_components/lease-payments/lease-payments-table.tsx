"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import {
	PAYMENT_METHOD_FILTER_OPTIONS,
	PAYMENT_TYPE_FILTER_OPTIONS,
} from "@/config/table-facet-meta";

type LeasePaymentsTableProps = {
	leaseId: number;
};

export default function LeasePaymentsTable({
	leaseId,
}: LeasePaymentsTableProps) {
	const { data: { items: payments } = { items: [] } } = useSuspenseQuery(
		orpc.payment.list.queryOptions({
			input: { leaseId },
		}),
	);

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
				/>
			</CardContent>
		</Card>
	);
}
