"use client";

import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import {
	formatCurrency,
	formatDisplayDate,
	formatExportDate,
} from "@/lib/exports/formatters";
import { ExportButtons } from "@/components/export/export-buttons";
import {
	PAYMENT_TYPE_FILTER_OPTIONS,
	PAYMENT_TYPE_REPORT_META,
	REPORT_TIME_RANGE_FILTER_OPTIONS,
} from "@/config/table-facet-meta";

import { useMemo, useState } from "react";
import { CalendarRange, Eye, Filter, Wallet } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn, getPastDate } from "@/lib/utils";
import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const paymentConfig = PAYMENT_TYPE_REPORT_META;

export default function RecentTransactions() {
	const {
		data: { items: transactions },
	} = useSuspenseQuery(
		orpc.report.paymentOverview.queryOptions({
			input: { from: getPastDate(90) },
		}),
	);

	const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
	const [timeRange, setTimeRange] = useState("all");

	const filteredTransactions = useMemo(() => {
		const now = new Date();
		const cutoffDate = new Date(now);

		return transactions.filter((transaction) => {
			const matchesType =
				paymentTypeFilter === "all" ||
				transaction.paymentType === paymentTypeFilter;

			let matchesRange = true;
			if (timeRange !== "all") {
				const days = Number(timeRange.replace("d", ""));
				cutoffDate.setDate(now.getDate() - days);
				const transactionDate = new Date(transaction.paymentDate);
				matchesRange =
					!Number.isNaN(transactionDate.getTime()) &&
					transactionDate >= cutoffDate;
			}

			return matchesType && matchesRange;
		});
	}, [paymentTypeFilter, timeRange, transactions]);

	const totalTransactions = filteredTransactions.length;

	const summaryData = Object.entries(paymentConfig)
		.map(([key, config]) => {
			const count = filteredTransactions.filter(
				(transaction) => transaction.paymentType === key,
			).length;

			return {
				...config,
				count,
				percentage:
					totalTransactions > 0
						? Number(((count / totalTransactions) * 100).toFixed(1))
						: 0,
			};
		})
		.filter((item) => item.count > 0);

	const exportRows = useMemo(() => {
		return filteredTransactions.map((transaction) => ({
			tenant: transaction.tenantName,
			unit: transaction.unitName,
			type:
				paymentConfig[transaction.paymentType as keyof typeof paymentConfig]
					?.label ?? transaction.paymentType,
			amount: formatCurrency(transaction.paymentAmount),
			date: formatExportDate(transaction.paymentDate),
		}));
	}, [filteredTransactions]);

	const resetFilters = () => {
		setPaymentTypeFilter("all");
		setTimeRange("all");
	};

	const filterText = `Type: ${
		paymentTypeFilter === "all"
			? "All payment types"
			: (paymentConfig[paymentTypeFilter as keyof typeof paymentConfig]
					?.label ?? paymentTypeFilter)
	} | Range: ${
		REPORT_TIME_RANGE_FILTER_OPTIONS.find(
			(option) => option.value === timeRange,
		)?.label ?? "All time"
	}`;

	return (
		<Card>
			<CardHeader className="space-y-4 pb-4">
				<div className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle>Recent Transactions</CardTitle>
						<CardDescription>Latest rent payments received</CardDescription>
					</div>
					<Link href={`/payments`}>
						<Button variant="outline" size="sm" className="cursor-pointer">
							<Eye className="size-4 mr-2" />
							View All
						</Button>
					</Link>
				</div>

				<Separator orientation="horizontal" />

				{/* Report Generation */}
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center gap-2 rounded-md border bg-background px-2">
							<Filter className="size-4 text-muted-foreground" />
							<Select
								value={paymentTypeFilter}
								onValueChange={setPaymentTypeFilter}
							>
								<SelectTrigger className="h-8 w-37.5 border-0 bg-transparent p-0 shadow-none">
									<SelectValue placeholder="Filter type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All payment types</SelectItem>
									{PAYMENT_TYPE_FILTER_OPTIONS.filter(
										(option) =>
											option.value in paymentConfig && option.value !== "other",
									).map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2 rounded-md border bg-background px-2">
							<CalendarRange className="size-4 text-muted-foreground" />

							<Select value={timeRange} onValueChange={setTimeRange}>
								<SelectTrigger className="h-8 w-35 border-0 bg-transparent p-0 shadow-none">
									<SelectValue placeholder="Time range" />
								</SelectTrigger>
								<SelectContent>
									{REPORT_TIME_RANGE_FILTER_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
						<ExportButtons
							disabled={filteredTransactions.length === 0}
							onCsv={() => exportCsv("recent-transactions", exportRows)}
							onPdf={() =>
								exportPdf({
									filename: "recent-transactions",
									title: "Recent Transactions Report",
									filters: filterText,
									headers: ["Tenant", "Unit", "Type", "Amount", "Date"],
									rows: exportRows.map((row) => [
										row.tenant,
										row.unit,
										row.type,
										row.amount,
										row.date,
									]),
									summary: [
										{
											metric: "Transactions in scope",
											value: `${totalTransactions}`,
										},
										...summaryData.map((item) => ({
											metric: item.label,
											value: `${item.count} payments (${item.percentage}%)`,
										})),
									],
								})
							}
						/>
						{(paymentTypeFilter !== "all" || timeRange !== "all") && (
							<Button variant="ghost" size="sm" onClick={resetFilters}>
								Reset
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{filteredTransactions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<Wallet className="mb-3 size-10 text-muted-foreground" />

						<p className="text-sm font-medium">
							No transactions match the current filters
						</p>

						<p className="text-xs text-muted-foreground">
							Try adjusting the filters or exporting the full set.
						</p>
					</div>
				) : (
					<>
						<div>
							<div className="mb-4 flex h-4 overflow-hidden rounded-full bg-muted">
								{summaryData.map((item) => (
									<div
										key={item.label}
										style={{
											width: `${item.percentage}%`,
											backgroundColor: item.chartColor,
										}}
									/>
								))}
							</div>

							<div className="space-y-3">
								{summaryData.map((item) => (
									<div
										key={item.label}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<div
												className="size-3 rounded-full"
												style={{
													backgroundColor: item.chartColor,
												}}
											/>

											<div>
												<p className="text-sm font-medium">{item.label}</p>

												<p className="text-xs text-muted-foreground">
													{item.count} payments
												</p>
											</div>
										</div>

										<span className="text-sm text-muted-foreground">
											{item.percentage}%
										</span>
									</div>
								))}
							</div>
						</div>

						<Separator orientation="horizontal" />

						<div>
							<div className="mb-3 flex items-center justify-between">
								<h4 className="text-sm font-semibold">Recent Activity</h4>

								<span className="text-xs text-muted-foreground">
									{totalTransactions} transaction
									{totalTransactions !== 1 ? "s" : ""}
								</span>
							</div>

							<div className="max-h-32 space-y-3 overflow-y-auto pr-1">
								{filteredTransactions.map((transaction) => {
									const config = paymentConfig[
										transaction.paymentType as keyof typeof paymentConfig
									] ?? {
										label: transaction.paymentType,
										chartColor: "var(--muted-foreground)",
										badgeClass: "bg-muted text-muted-foreground",
									};

									return (
										<div
											key={transaction.paymentId}
											className="flex items-center justify-between rounded-lg border p-2.5"
										>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<div
														className="size-2 rounded-full shrink-0"
														style={{ backgroundColor: config.chartColor }}
													/>

													<p className="truncate text-sm font-medium">
														{transaction.tenantName}
													</p>

													<Badge
														className={cn(
															"h-5 px-1.5 text-[10px]",
															config.badgeClass,
														)}
													>
														{config.label}
													</Badge>
												</div>

												<p className="truncate text-xs text-muted-foreground ml-4">
													{transaction.unitName}
												</p>
											</div>

											<div className="text-right shrink-0">
												<p className="text-sm font-semibold">
													{transaction.paymentAmount}
												</p>

												<p className="text-[11px] text-muted-foreground">
													{formatDisplayDate(transaction.paymentDate)}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
