"use client";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import type { ListPaymentOutput } from "@/app/schemas/payment.schema";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export/export-buttons";
import { Card, CardContent } from "@/components/ui/card";
import {
	PAYMENT_METHOD_FILTER_OPTIONS,
	PAYMENT_METHOD_META,
	PAYMENT_TYPE_FILTER_OPTIONS,
	PAYMENT_TYPE_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { formatCurrency, formatExportDate } from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import { columns } from "./columns";

const DEFAULT_PAGE_SIZE = 10;

export default function PaymentsTable() {
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [cursorHistory, setCursorHistory] = useState<(number | null)[]>([]);
	const [currentCursor, setCurrentCursor] = useState<number | null>(null);

	const { data } = useSuspenseQuery(
		orpc.payment.list.queryOptions({
			input: {
				limit: pageSize,
				cursor: currentCursor ?? undefined,
			},
		}),
	);

	const payments = data.items;
	const nextCursor = data.nextCursor;
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
			receiptNumber: payment.receiptNumber,
			unit: payment.leaseSummary?.unitName ?? "-",
			tenant: payment.leaseSummary?.tenantName ?? "-",
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
					PAYMENT_METHOD_META[value as keyof typeof PAYMENT_METHOD_META]
						?.label ?? value,
			);
			filterParts.push(`Payment method: ${paymentMethodLabels.join(", ")}`);
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
							"Receipt No",
							"Unit",
							"Tenant",
							"Type",
							"Method",
							"Amount",
							"Date",
							"Description",
						],
						rows: exportRows.map((row) => [
							row.receiptNumber,
							row.unit,
							row.tenant,
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

	return (
		<Card>
			<CardContent>
				<DataTable
					data={payments}
					columns={columns}
					facetedFilters={facetedFilters}
					renderToolbarActions={renderToolbarActions}
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
