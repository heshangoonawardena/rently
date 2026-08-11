"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import Link from "next/link";
import * as React from "react";
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
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { orpc } from "@/lib/orpc";

type MaintenanceView = "status" | "priority" | "type";

export default function MaintenanceOverview() {
	const repairsQuery = useQuery(
		orpc.report.repairSummary.queryOptions({
			input: {},
		}),
	);
	const isLoading = repairsQuery.isLoading || repairsQuery.isFetching;
	const repairsData = React.useMemo(
		() =>
			repairsQuery.data ?? {
				open: 0,
				inProgress: 0,
				resolved: 0,
				cancelled: 0,
				byPriority: {
					low: 0,
					medium: 0,
					high: 0,
					urgent: 0,
				},
				byType: {
					plumbing: 0,
					electrical: 0,
					structural: 0,
					other: 0,
				},
			},
		[repairsQuery.data],
	);

	const [view, setView] = React.useState<MaintenanceView>("status");

	const viewLabelMap: Record<MaintenanceView, string> = {
		status: "Status",
		priority: "Priority",
		type: "Type",
	};

	const data = React.useMemo(() => {
		switch (view) {
			case "priority": {
				const total = Object.values(repairsData.byPriority).reduce(
					(a, b) => a + b,
					0,
				);

				return [
					{
						label: "Low",
						value: repairsData.byPriority.low,
						percentage: total ? (repairsData.byPriority.low / total) * 100 : 0,
						color: "var(--chart-5)",
					},
					{
						label: "Medium",
						value: repairsData.byPriority.medium,
						percentage: total
							? (repairsData.byPriority.medium / total) * 100
							: 0,
						color: "var(--chart-4)",
					},
					{
						label: "High",
						value: repairsData.byPriority.high,
						percentage: total ? (repairsData.byPriority.high / total) * 100 : 0,
						color: "var(--chart-3)",
					},
					{
						label: "Urgent",
						value: repairsData.byPriority.urgent,
						percentage: total
							? (repairsData.byPriority.urgent / total) * 100
							: 0,
						color: "var(--chart-1)",
					},
				];
			}

			case "type": {
				const total = Object.values(repairsData.byType).reduce(
					(a, b) => a + b,
					0,
				);

				return [
					{
						label: "Plumbing",
						value: repairsData.byType.plumbing,
						percentage: total ? (repairsData.byType.plumbing / total) * 100 : 0,
						color: "var(--chart-1)",
					},
					{
						label: "Electrical",
						value: repairsData.byType.electrical,
						percentage: total
							? (repairsData.byType.electrical / total) * 100
							: 0,
						color: "var(--chart-3)",
					},
					{
						label: "Structural",
						value: repairsData.byType.structural,
						percentage: total
							? (repairsData.byType.structural / total) * 100
							: 0,
						color: "var(--chart-4)",
					},
					{
						label: "Other",
						value: repairsData.byType.other,
						percentage: total ? (repairsData.byType.other / total) * 100 : 0,
						color: "var(--chart-5)",
					},
				];
			}

			default: {
				const status = {
					Open: repairsData.open,
					"In Progress": repairsData.inProgress,
					Resolved: repairsData.resolved,
					Cancelled: repairsData.cancelled,
				};

				const total = Object.values(status).reduce((a, b) => a + b, 0);

				return [
					{
						label: "Open",
						value: repairsData.open,
						percentage: total ? (repairsData.open / total) * 100 : 0,
						color: "var(--chart-1)",
					},
					{
						label: "In Progress",
						value: repairsData.inProgress,
						percentage: total ? (repairsData.inProgress / total) * 100 : 0,
						color: "var(--chart-3)",
					},
					{
						label: "Resolved",
						value: repairsData.resolved,
						percentage: total ? (repairsData.resolved / total) * 100 : 0,
						color: "var(--chart-2)",
					},
					{
						label: "Cancelled",
						value: repairsData.cancelled,
						percentage: total ? (repairsData.cancelled / total) * 100 : 0,
						color: "var(--chart-5)",
					},
				];
			}
		}
	}, [repairsData, view]);

	const total = data.reduce((sum, item) => sum + item.value, 0);

	const exportRows = React.useMemo(() => {
		return data.map((item) => ({
			category: item.label,
			jobs: `${item.value}`,
			percentage: `${item.percentage.toFixed(1)}%`,
		}));
	}, [data]);

	const filterText = `View: ${viewLabelMap[view]}`;

	return (
		<Card>
			<CardHeader className="space-y-4 pb-4">
				<div className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle>Maintenance Overview</CardTitle>
						<CardDescription>
							Track maintenance requests by status, priority, or type
						</CardDescription>
					</div>
					<Link href={`/repairs`}>
						<Button variant="outline" size="sm">
							<Eye className="size-4 mr-2" />
							View All
						</Button>
					</Link>
				</div>

				<Separator orientation="horizontal" />

				{/* Report Generation */}
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<Select
						value={view}
						onValueChange={(value) => setView(value as MaintenanceView)}
					>
						<SelectTrigger className="w-35">
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="status">Status</SelectItem>
							<SelectItem value="priority">Priority</SelectItem>
							<SelectItem value="type">Type</SelectItem>
						</SelectContent>
					</Select>

					<ExportButtons
						disabled={isLoading || total === 0}
						onCsv={() => exportCsv("maintenance-overview", exportRows)}
						onPdf={() =>
							exportPdf({
								filename: "maintenance-overview",
								title: `Maintenance Overview - ${viewLabelMap[view]}`,
								filters: filterText,
								headers: ["Category", "Jobs", "Percentage"],
								rows: exportRows.map((row) => [
									row.category,
									row.jobs,
									row.percentage,
								]),
								summary: [
									{ metric: "Total maintenance requests", value: `${total}` },
									...data.map((item) => ({
										metric: item.label,
										value: `${item.value} job${item.value !== 1 ? "s" : ""} (${item.percentage.toFixed(1)}%)`,
									})),
								],
							})
						}
					/>
				</div>
			</CardHeader>

			<CardContent>
				{isLoading ? (
					<div className="space-y-6">
						<div className="mb-6">
							<Skeleton className="mb-2 h-9 w-24" />
							<Skeleton className="h-4 w-40" />
						</div>

						<Skeleton className="h-4 w-full rounded-full" />

						<div className="space-y-4">
							{Array.from({ length: 4 }).map((_, index) => (
								<div
									key={`maintenance-skeleton-${index}`}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-3">
										<Skeleton className="size-3 rounded-full" />
										<div className="space-y-2">
											<Skeleton className="h-3 w-24" />
											<Skeleton className="h-3 w-16" />
										</div>
									</div>
									<Skeleton className="h-3 w-10" />
								</div>
							))}
						</div>
					</div>
				) : (
					<>
						<div className="mb-6">
							<div className="text-3xl font-bold">{total}</div>
							<p className="text-sm text-muted-foreground">
								Total maintenance requests
							</p>
						</div>

						{/* Segmented bar */}
						<div className="mb-6 flex h-4 overflow-hidden rounded-full bg-muted">
							{data.map((item) => (
								<div
									key={item.label}
									style={{
										width: `${item.percentage}%`,
										backgroundColor: item.color,
									}}
								/>
							))}
						</div>

						<div className="space-y-4">
							{data.map((item) => (
								<div
									key={item.label}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-3">
										<span
											className="size-3 rounded-full"
											style={{ backgroundColor: item.color }}
										/>

										<div>
											<p className="text-sm font-medium">{item.label}</p>
											<p className="text-xs text-muted-foreground">
												{item.value} job{item.value !== 1 ? "s" : ""}
											</p>
										</div>
									</div>

									<div className="text-sm font-medium">
										{item.percentage.toFixed(0)}%
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
