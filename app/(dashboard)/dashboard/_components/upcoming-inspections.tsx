"use client";

import { ExportButtons } from "@/components/export/export-buttons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { REPORT_TIME_RANGE_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { exportCsv } from "@/lib/exports/csv";
import { exportPdf } from "@/lib/exports/pdf";
import { formatDisplayDate, formatExportDate } from "@/lib/exports/formatters";
import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarRange, Eye, Filter } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function getUrgency(days: number) {
	if (days <= 7) return "urgent";
	if (days <= 30) return "soon";
	return "normal";
}

function getUrgencyStyle(type: "urgent" | "soon" | "normal") {
	const map = {
		urgent: "var(--chart-1)",
		soon: "var(--chart-4)",
		normal: "var(--chart-5)",
	};

	return map[type];
}

const urgencyLabelMap = {
	urgent: "Urgent",
	soon: "Soon",
	normal: "Normal",
} as const;

export default function UpcomingInspections() {
	const {
		data: { rows: inspections },
	} = useSuspenseQuery(
		orpc.report.upcomingInspections.queryOptions({ input: { daysAhead: 90 } }),
	);

	const [urgencyFilter, setUrgencyFilter] = useState<
		"all" | "urgent" | "soon" | "normal"
	>("all");
	const [timeRange, setTimeRange] = useState("all");

	const filteredInspections = useMemo(() => {
		let result = inspections;

		if (urgencyFilter !== "all") {
			result = result.filter(
				(item) => getUrgency(item.daysUntilInspection) === urgencyFilter,
			);
		}

		if (timeRange !== "all") {
			const days = Number(timeRange.replace("d", ""));
			result = result.filter((item) => item.daysUntilInspection <= days);
		}

		return result;
	}, [inspections, timeRange, urgencyFilter]);

	const summary = filteredInspections.reduce(
		(acc, item) => {
			acc[getUrgency(item.daysUntilInspection)]++;
			return acc;
		},
		{ urgent: 0, soon: 0, normal: 0 },
	);

	const total = filteredInspections.length;
	const safeTotal = total > 0 ? total : 1;

	const exportRows = useMemo(() => {
		return filteredInspections.map((item) => {
			const urgency = getUrgency(item.daysUntilInspection);

			return {
				title: item.title,
				unit: item.unitName,
				assignedTo: item.assignedUserName ?? "Unassigned",
				urgency: urgencyLabelMap[urgency],
				daysUntilInspection: `${item.daysUntilInspection}`,
				scheduledDate: formatExportDate(item.scheduledDate),
			};
		});
	}, [filteredInspections]);

	const filterText = `Urgency: ${
		urgencyFilter === "all" ? "All" : urgencyLabelMap[urgencyFilter]
	} | Range: ${
		REPORT_TIME_RANGE_FILTER_OPTIONS.find(
			(option) => option.value === timeRange,
		)?.label ?? "All time"
	}`;

	const resetFilters = () => {
		setUrgencyFilter("all");
		setTimeRange("all");
	};

	return (
		<Card>
			<CardHeader className="space-y-4 pb-4">
				<div className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle>Upcoming Inspections</CardTitle>
						<CardDescription>
							Scheduled unit inspections and assignments
						</CardDescription>
					</div>

					<Link href="/inspections">
						<Button variant="outline" size="sm">
							<Eye className="mr-2 size-4" />
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
								value={urgencyFilter}
								onValueChange={(value) =>
									setUrgencyFilter(
										value as "all" | "urgent" | "soon" | "normal",
									)
								}
							>
								<SelectTrigger className="h-8 w-35 border-0 bg-transparent p-0 shadow-none">
									<SelectValue placeholder="Urgency" />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="all">All urgencies</SelectItem>
									<SelectItem value="urgent">Urgent</SelectItem>
									<SelectItem value="soon">Soon</SelectItem>
									<SelectItem value="normal">Normal</SelectItem>
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
							disabled={filteredInspections.length === 0}
							onCsv={() => exportCsv("upcoming-inspections", exportRows)}
							onPdf={() =>
								exportPdf({
									filename: "upcoming-inspections",
									title: "Upcoming Inspections Report",
									filters: filterText,
									headers: [
										"Title",
										"Unit",
										"Assigned To",
										"Urgency",
										"Days Until Inspection",
										"Scheduled Date",
									],
									rows: exportRows.map((row) => [
										row.title,
										row.unit,
										row.assignedTo,
										row.urgency,
										row.daysUntilInspection,
										row.scheduledDate,
									]),
									summary: [
										{
											metric: "Inspections in scope",
											value: `${filteredInspections.length}`,
										},
										{
											metric: "Urgent",
											value: `${summary.urgent}`,
										},
										{
											metric: "Soon",
											value: `${summary.soon}`,
										},
										{
											metric: "Normal",
											value: `${summary.normal}`,
										},
									],
								})
							}
						/>

						{(urgencyFilter !== "all" || timeRange !== "all") && (
							<Button variant="ghost" size="sm" onClick={resetFilters}>
								Reset
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-5">
				{/* Pipeline */}
				<div className="flex h-3 overflow-hidden rounded-full bg-muted">
					<div
						style={{
							width: `${(summary.urgent / safeTotal) * 100}%`,
							backgroundColor: getUrgencyStyle("urgent"),
						}}
					/>
					<div
						style={{
							width: `${(summary.soon / safeTotal) * 100}%`,
							backgroundColor: getUrgencyStyle("soon"),
						}}
					/>
					<div
						style={{
							width: `${(summary.normal / safeTotal) * 100}%`,
							backgroundColor: getUrgencyStyle("normal"),
						}}
					/>
				</div>

				{/* Summary pills */}
				<div className="flex flex-wrap gap-2">
					{(["urgent", "soon", "normal"] as const).map((type) => (
						<div
							key={type}
							className="rounded-full px-3 py-1 text-xs"
							style={{
								backgroundColor: `${getUrgencyStyle(type)}20`,
								color: getUrgencyStyle(type),
							}}
						>
							{summary[type]} {type}
						</div>
					))}
				</div>

				{/* List */}
				<div className="space-y-3">
					{filteredInspections.map((item) => {
						const urgency = getUrgency(item.daysUntilInspection);

						return (
							<div
								key={item.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div>
									<p className="text-sm font-medium">{item.title}</p>
									<p className="text-xs text-muted-foreground">
										{item.unitName} • {item.assignedUserName}
									</p>
								</div>

								<div className="text-right">
									<p
										className="text-sm font-semibold"
										style={{ color: getUrgencyStyle(urgency) }}
									>
										{item.daysUntilInspection} days
									</p>

									<p className="text-xs text-muted-foreground">
										{formatDisplayDate(item.scheduledDate)}
									</p>
								</div>
							</div>
						);
					})}

					{filteredInspections.length === 0 && (
						<div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
							No inspections match the current filters.
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
