"use client";

import * as React from "react";
import { ExportButtons } from "@/components/export/export-buttons";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type MaintenanceView = "status" | "priority" | "type";

export default function MaintenanceOverview() {
	const { data: repairs } = useSuspenseQuery(
		orpc.report.repairSummary.queryOptions({
			input: {},
		}),
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
				const total = Object.values(repairs.byPriority).reduce(
					(a, b) => a + b,
					0,
				);

				return [
					{
						label: "Low",
						value: repairs.byPriority.low,
						percentage: total ? (repairs.byPriority.low / total) * 100 : 0,
						color: "var(--chart-5)",
					},
					{
						label: "Medium",
						value: repairs.byPriority.medium,
						percentage: total ? (repairs.byPriority.medium / total) * 100 : 0,
						color: "var(--chart-4)",
					},
					{
						label: "High",
						value: repairs.byPriority.high,
						percentage: total ? (repairs.byPriority.high / total) * 100 : 0,
						color: "var(--chart-3)",
					},
					{
						label: "Urgent",
						value: repairs.byPriority.urgent,
						percentage: total ? (repairs.byPriority.urgent / total) * 100 : 0,
						color: "var(--chart-1)",
					},
				];
			}

			case "type": {
				const total = Object.values(repairs.byType).reduce((a, b) => a + b, 0);

				return [
					{
						label: "Plumbing",
						value: repairs.byType.plumbing,
						percentage: total ? (repairs.byType.plumbing / total) * 100 : 0,
						color: "var(--chart-1)",
					},
					{
						label: "Electrical",
						value: repairs.byType.electrical,
						percentage: total ? (repairs.byType.electrical / total) * 100 : 0,
						color: "var(--chart-3)",
					},
					{
						label: "Structural",
						value: repairs.byType.structural,
						percentage: total ? (repairs.byType.structural / total) * 100 : 0,
						color: "var(--chart-4)",
					},
					{
						label: "Other",
						value: repairs.byType.other,
						percentage: total ? (repairs.byType.other / total) * 100 : 0,
						color: "var(--chart-5)",
					},
				];
			}

			default: {
				const status = {
					Open: repairs.open,
					"In Progress": repairs.inProgress,
					Resolved: repairs.resolved,
					Cancelled: repairs.cancelled,
				};

				const total = Object.values(status).reduce((a, b) => a + b, 0);

				return [
					{
						label: "Open",
						value: repairs.open,
						percentage: total ? (repairs.open / total) * 100 : 0,
						color: "var(--chart-1)",
					},
					{
						label: "In Progress",
						value: repairs.inProgress,
						percentage: total ? (repairs.inProgress / total) * 100 : 0,
						color: "var(--chart-3)",
					},
					{
						label: "Resolved",
						value: repairs.resolved,
						percentage: total ? (repairs.resolved / total) * 100 : 0,
						color: "var(--chart-2)",
					},
					{
						label: "Cancelled",
						value: repairs.cancelled,
						percentage: total ? (repairs.cancelled / total) * 100 : 0,
						color: "var(--chart-5)",
					},
				];
			}
		}
	}, [view]);

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
						<Button variant="outline" size="sm" className="cursor-pointer">
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
						disabled={total === 0}
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
						<div key={item.label} className="flex items-center justify-between">
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
			</CardContent>
		</Card>
	);
}
