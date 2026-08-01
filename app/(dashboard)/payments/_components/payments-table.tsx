"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { orpc } from "@/lib/orpc";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatCurrency, formatExportDate } from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import {
	PAYMENT_METHOD_META,
	PAYMENT_METHOD_FILTER_OPTIONS,
	PAYMENT_TYPE_META,
	PAYMENT_TYPE_FILTER_OPTIONS,
} from "@/config/table-facet-meta";
import type { ListPaymentOutput } from "@/app/schemas/payment.schema";
import type { Table } from "@tanstack/react-table";

export default function PaymentsTable() {
	const { data: { items: payments } = { items: [] } } = useSuspenseQuery(
		orpc.payment.list.queryOptions({ input: {} }),
	);
	type PaymentRow = ListPaymentOutput["items"][number];

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

	const renderToolbarActions = (table: Table<PaymentRow>) => {
		const sortedRows = table.getSortedRowModel().rows;

		const exportRows = sortedRows.map(({ original: payment }) => ({
			paymentId: payment.id,
			leaseId: payment.leaseId,
			type:
				PAYMENT_TYPE_META[payment.paymentType as keyof typeof PAYMENT_TYPE_META]
					?.label ?? payment.paymentType,
			method:
				PAYMENT_METHOD_META[
					payment.paymentMethod as keyof typeof PAYMENT_METHOD_META
				]?.label ?? payment.paymentMethod,
			amount: formatCurrency(payment.paymentAmount),
			date: formatExportDate(payment.paymentDate),
			description: payment.description ?? "-",
		}));

		const filterParts: string[] = [];
		const globalSearch = String(table.getState().globalFilter ?? "").trim();

		if (globalSearch) {
			filterParts.push(`Search: ${globalSearch}`);
		}

		const paymentTypeFilter = table
			.getColumn("paymentType")
			?.getFilterValue() as string[] | undefined;

		if (paymentTypeFilter?.length) {
			const paymentTypeLabels = paymentTypeFilter.map(
				(value) =>
					PAYMENT_TYPE_META[value as keyof typeof PAYMENT_TYPE_META]?.label ??
					value,
			);
			filterParts.push(`Payment type: ${paymentTypeLabels.join(", ")}`);
		}

		const paymentMethodFilter = table
			.getColumn("paymentMethod")
			?.getFilterValue() as string[] | undefined;

		if (paymentMethodFilter?.length) {
			const paymentMethodLabels = paymentMethodFilter.map(
				(value) =>
					PAYMENT_METHOD_META[value as keyof typeof PAYMENT_METHOD_META]?.label ??
					value,
			);
			filterParts.push(`Method: ${paymentMethodLabels.join(", ")}`);
		}

		const filterText = filterParts.length
			? filterParts.join(" | ")
			: "All records";

		return (
			<ExportButtons
				disabled={exportRows.length === 0}
				onCsv={() => exportCsv("payments", exportRows)}
				onPdf={() =>
					exportPdf({
						filename: "payments",
						title: "Payments Report",
						filters: filterText,
						headers: [
							"Payment ID",
							"Lease",
							"Type",
							"Method",
							"Amount",
							"Date",
							"Description",
						],
						rows: exportRows.map((row) => [
							row.paymentId,
							row.leaseId,
							row.type,
							row.method,
							row.amount,
							row.date,
							row.description,
						]),
						summary: [
							{
								metric: "Payments in scope",
								value: `${exportRows.length}`,
							},
						],
					})
				}
			/>
		);
	};

	return (
		<Card>
			<CardContent>
				<DataTable
					data={payments}
					columns={columns}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
				/>
			</CardContent>
		</Card>
	);
}
