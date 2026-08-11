"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Filter } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExportButtons } from "@/components/export/export-buttons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	UNIT_STATUS_FILTER_OPTIONS,
	UNIT_STATUS_META,
} from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { formatDisplayDate, formatExportDate } from "@/lib/exports/formatters";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";

const occupancyConfig = {
	occupied: {
		label: UNIT_STATUS_META.occupied.label,
		color: "var(--chart-2)",
	},
	available: {
		label: UNIT_STATUS_META.available.label,
		color: "var(--chart-1)",
	},
	maintenance: {
		label: "Under Maintenance",
		color: "var(--chart-3)",
	},
	inactive: {
		label: UNIT_STATUS_META.inactive.label,
		color: "var(--chart-4)",
	},
} as const;

type OccupancyKey = keyof typeof occupancyConfig;

export default function PropertyOccupancy() {
	const occupancyQuery = useQuery(orpc.report.occupancySummary.queryOptions());
	const expiringLeasesQuery = useQuery(
		orpc.report.expiringLeases.queryOptions({ input: {} }),
	);

	const isLoading =
		occupancyQuery.isLoading ||
		occupancyQuery.isFetching ||
		expiringLeasesQuery.isLoading ||
		expiringLeasesQuery.isFetching;

	const occupancyData = occupancyQuery.data ?? {
		total: 0,
		occupied: 0,
		available: 0,
		maintenance: 0,
		inactive: 0,
	};
	const expiringLeases = expiringLeasesQuery.data?.rows ?? [];

	const [occupancyFilter, setOccupancyFilter] = useState<"all" | OccupancyKey>(
		"all",
	);

	const safeTotal = occupancyData.total > 0 ? occupancyData.total : 1;

	const pipelineData = [
		{
			key: "occupied" as const,
			title: occupancyConfig.occupied.label,
			value: occupancyData.occupied,
			percentage: Number(
				((occupancyData.occupied / safeTotal) * 100).toFixed(1),
			),
			color: occupancyConfig.occupied.color,
		},
		{
			key: "available" as const,
			title: occupancyConfig.available.label,
			value: occupancyData.available,
			percentage: Number(
				((occupancyData.available / safeTotal) * 100).toFixed(1),
			),
			color: occupancyConfig.available.color,
		},
		{
			key: "maintenance" as const,
			title: occupancyConfig.maintenance.label,
			value: occupancyData.maintenance,
			percentage: Number(
				((occupancyData.maintenance / safeTotal) * 100).toFixed(1),
			),
			color: occupancyConfig.maintenance.color,
		},
		{
			key: "inactive" as const,
			title: occupancyConfig.inactive.label,
			value: occupancyData.inactive,
			percentage: Number(
				((occupancyData.inactive / safeTotal) * 100).toFixed(1),
			),
			color: occupancyConfig.inactive.color,
		},
	];

	const filteredPipelineData = useMemo(() => {
		if (occupancyFilter === "all") {
			return pipelineData;
		}

		return pipelineData.filter((item) => item.key === occupancyFilter);
	}, [occupancyFilter, pipelineData]);

	const filteredExpiringLeases = expiringLeases;

	const totalUnitsInScope = filteredPipelineData.reduce(
		(total, item) => total + item.value,
		0,
	);

	const exportRows = useMemo(() => {
		return filteredExpiringLeases.map((lease) => ({
			tenant: lease.tenantName,
			unit: lease.unitName,
			status: lease.status,
			daysUntilExpiry: `${lease.daysUntilExpiry}`,
			endDate: formatExportDate(lease.endDate),
		}));
	}, [filteredExpiringLeases]);

	const filterText = `Occupancy: ${
		occupancyFilter === "all"
			? "All statuses"
			: (occupancyConfig[occupancyFilter]?.label ?? occupancyFilter)
	}`;

	const resetFilters = () => {
		setOccupancyFilter("all");
	};

	return (
		<Card>
			<CardHeader className="space-y-4 pb-4">
				<div className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle>Property Occupancy</CardTitle>
						<CardDescription>
							Current occupancy status of all units
						</CardDescription>
					</div>
					<Link href="/units">
						<Button variant="outline" size="sm">
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
								value={occupancyFilter}
								onValueChange={(value) =>
									setOccupancyFilter(value as "all" | OccupancyKey)
								}
							>
								<SelectTrigger className="h-8 w-37.5 border-0 bg-transparent p-0 shadow-none">
									<SelectValue placeholder="Occupancy status" />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									{UNIT_STATUS_FILTER_OPTIONS.filter(
										(option) => option.value in occupancyConfig,
									).map((option) => (
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
							disabled={
								isLoading ||
								(occupancyData.total === 0 &&
									filteredExpiringLeases.length === 0)
							}
							onCsv={() => exportCsv("property-occupancy", exportRows)}
							onPdf={() =>
								exportPdf({
									filename: "property-occupancy",
									title: "Property Occupancy Report",
									filters: filterText,
									headers: [
										"Tenant",
										"Unit",
										"Lease Status",
										"Days Until Expiry",
										"End Date",
									],
									rows: exportRows.map((row) => [
										row.tenant,
										row.unit,
										row.status,
										row.daysUntilExpiry,
										row.endDate,
									]),
									summary: [
										{
											metric: "Total units",
											value: `${occupancyData.total}`,
										},
										{
											metric: "Units in scope",
											value: `${totalUnitsInScope}`,
										},
										...filteredPipelineData.map((item) => ({
											metric: item.title,
											value: `${item.value} units (${item.percentage}%)`,
										})),
										{
											metric: "Expiring leases in scope",
											value: `${filteredExpiringLeases.length}`,
										},
									],
								})
							}
						/>

						{occupancyFilter !== "all" && (
							<Button variant="ghost" size="sm" onClick={resetFilters}>
								Reset
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{isLoading ? (
					<div className="space-y-6">
						<Skeleton className="mb-6 h-4 w-full rounded-full" />

						<div className="space-y-5">
							{Array.from({ length: 4 }).map((_, index) => (
								<div
									key={`occupancy-skeleton-${index}`}
									className="flex items-center justify-between"
								>
									<div className="flex items-start gap-3">
										<Skeleton className="mt-1.5 size-3 rounded-full" />
										<div className="space-y-2">
											<Skeleton className="h-3 w-24" />
											<Skeleton className="h-3 w-16" />
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Skeleton className="h-2 w-14 rounded-full" />
										<Skeleton className="h-3 w-8" />
									</div>
								</div>
							))}
						</div>

						<div className="border-t" />

						<div className="space-y-3">
							<Skeleton className="h-4 w-24" />
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={`lease-skeleton-${index}`}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="space-y-2">
										<Skeleton className="h-3 w-28" />
										<Skeleton className="h-3 w-20" />
									</div>
									<div className="space-y-2 text-right">
										<Skeleton className="h-3 w-16" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<>
						{/* Segmented Pipeline Bar */}
						<div className="mb-6 flex h-4 overflow-hidden rounded-full bg-muted">
							{filteredPipelineData.map((item) => (
								<div
									key={item.title}
									style={{
										width: `${item.percentage}%`,
										backgroundColor: item.color,
									}}
								/>
							))}
						</div>

						{/* Pipeline Items */}
						<div className="space-y-5">
							{filteredPipelineData.map((item) => (
								<div
									key={item.title}
									className="flex items-center justify-between"
								>
									<div className="flex items-start gap-3">
										<div
											className="mt-1.5 size-3 rounded-full"
											style={{ backgroundColor: item.color }}
										/>

										<div>
											<div className="text-sm font-medium text-foreground">
												{item.title}
											</div>

											<div className="text-xs text-muted-foreground">
												{item.value} units
											</div>
										</div>
									</div>

									<div className="flex items-center gap-3">
										{/* Mini progress indicator */}
										<div className="h-2 w-14 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-black"
												style={{
													width: `${item.percentage}%`,
												}}
											/>
										</div>

										<span className="w-8 text-right text-sm text-muted-foreground">
											{item.percentage}%
										</span>
									</div>
								</div>
							))}
						</div>

						{/* Divider */}
						<div className="border-t" />

						{/* Expiring Leases Section */}
						<div>
							<div className="mb-3 flex items-center justify-between">
								<h4 className="text-sm font-semibold">Expiring Leases</h4>
								<span className="text-xs text-muted-foreground">
									{filteredExpiringLeases.length} lease
									{filteredExpiringLeases.length !== 1 ? "s" : ""}
								</span>
							</div>

							<div className="space-y-3">
								{filteredExpiringLeases.map((lease) => (
									<div
										key={lease.leaseId}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="text-sm font-medium">{lease.tenantName}</p>
											<p className="text-xs text-muted-foreground">
												{lease.unitName}
											</p>
										</div>

										<div className="text-right">
											<p
												className={`text-sm font-semibold ${
													lease.daysUntilExpiry <= 30
														? "text-destructive"
														: "text-amber-500"
												}`}
											>
												{lease.daysUntilExpiry} days
											</p>

											<p className="text-xs text-muted-foreground">
												Ends on {formatDisplayDate(lease.endDate)}
											</p>
										</div>
									</div>
								))}

								{filteredExpiringLeases.length === 0 && (
									<div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
										No expiring leases match the selected time range.
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
