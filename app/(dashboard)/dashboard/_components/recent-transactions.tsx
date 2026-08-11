"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Eye, Filter, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExportButtons } from "@/components/export/export-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	PAYMENT_TYPE_FILTER_OPTIONS,
	PAYMENT_TYPE_REPORT_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import {
	formatCurrency,
	formatDisplayDate,
	formatExportDate,
} from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";
import { cn, formatDateOnly } from "@/lib/utils";

const paymentConfig = PAYMENT_TYPE_REPORT_META;

export default function RecentTransactions() {
	const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
	const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
	const [toDate, setToDate] = useState<Date | undefined>(undefined);

	const queryInput = useMemo(
		() => ({
			limit: 5,
			from: fromDate ? formatDateOnly(fromDate) : undefined,
			to: toDate ? formatDateOnly(toDate) : undefined,
			paymentType:
				paymentTypeFilter === "all"
					? undefined
					: (paymentTypeFilter as keyof typeof PAYMENT_TYPE_REPORT_META),
		}),
		[fromDate, paymentTypeFilter, toDate],
	);

	console.log("period : ", queryInput);

	const { data, isLoading, isFetching } = useQuery(
		orpc.report.paymentOverview.queryOptions({
			input: queryInput,
		}),
	);

	const filteredTransactions = data?.items ?? [];
	const showSkeletons = isLoading || isFetching;

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
		setFromDate(undefined);
		setToDate(undefined);
	};

	const filterText = `Type: ${
		paymentTypeFilter === "all"
			? "All payment types"
			: (paymentConfig[paymentTypeFilter as keyof typeof paymentConfig]
					?.label ?? paymentTypeFilter)
	} | From: ${fromDate ? formatDateOnly(fromDate) : "Any"} | To: ${
		toDate ? formatDateOnly(toDate) : "Any"
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
						<Button variant="outline" size="sm">
							<Eye className="size-4 mr-2" />
							View All
						</Button>
					</Link>
				</div>

				<Separator orientation="horizontal" />

				{/* Report Generation */}
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col flex-wrap items-start gap-2">
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

						<div className="flex justify-between gap-2">
							<div className="flex items-center gap-2 rounded-md border bg-background px-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 px-0 font-normal hover:bg-transparent"
										>
											<CalendarIcon className="mr-2 size-4 text-muted-foreground" />
											{fromDate ? format(fromDate, "d MMM yyyy") : "From"}
										</Button>
									</PopoverTrigger>

									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={fromDate}
											onSelect={(date) => {
												if (!date) {
													setFromDate(undefined);
													return;
												}

												setFromDate(date);
												if (toDate && date > toDate) {
													setToDate(date);
												}
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="flex items-center gap-2 rounded-md border bg-background px-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 px-0 font-normal hover:bg-transparent"
										>
											<CalendarIcon className="mr-2 size-4 text-muted-foreground" />
											{toDate ? format(toDate, "d MMM yyyy") : "To"}
										</Button>
									</PopoverTrigger>

									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={toDate}
											disabled={fromDate ? { before: fromDate } : undefined}
											onSelect={(date) => {
												if (!date) {
													setToDate(undefined);
													return;
												}

												setToDate(date);
												if (fromDate && date < fromDate) {
													setFromDate(date);
												}
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>
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
						{(paymentTypeFilter !== "all" || fromDate || toDate) && (
							<Button variant="ghost" size="sm" onClick={resetFilters}>
								Reset
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{showSkeletons ? (
					<>
						<div>
							<Skeleton className="mb-4 h-4 w-full rounded-full" />
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, index) => (
									<div
										key={`summary-skeleton-${index}`}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-3">
											<Skeleton className="size-3 rounded-full" />
											<div className="space-y-1.5">
												<Skeleton className="h-3 w-28" />
												<Skeleton className="h-3 w-18" />
											</div>
										</div>
										<Skeleton className="h-3 w-10" />
									</div>
								))}
							</div>
						</div>

						<Separator orientation="horizontal" />

						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, index) => (
								<div
									key={`row-skeleton-${index}`}
									className="flex items-center justify-between rounded-lg border p-2.5"
								>
									<div className="min-w-0 flex-1 space-y-2">
										<Skeleton className="h-3 w-35" />
										<Skeleton className="h-3 w-24" />
									</div>
									<div className="space-y-2 text-right">
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-3 w-20" />
									</div>
								</div>
							))}
						</div>
					</>
				) : filteredTransactions.length === 0 ? (
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
													{formatCurrency(transaction.paymentAmount)}
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
