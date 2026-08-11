"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { KpiCard, type KpiCardData } from "@/components/kpi-card";
import { orpc } from "@/lib/orpc";

export default function KpiCards() {
	const { data: report } = useSuspenseQuery(
		orpc.report.upcomingInspections.queryOptions({ input: { daysAhead: 60 } }),
	);

	const rows = report.rows;
	const dueThisWeek = rows.filter(
		(inspection) => inspection.daysUntilInspection <= 7,
	);
	const uniqueUnits = new Set(rows.map((inspection) => inspection.unitId)).size;
	const nextInspection = rows[0];

	const cards: KpiCardData[] = [
		{
			title: "Upcoming Inspections",
			value: `${rows.length}`,
			subtitle: "Inspections scheduled in the next 60 days",
			segments: [
				{
					label: "Due this week",
					value: dueThisWeek.length,
					color: "var(--chart-2)",
				},
				{
					label: "Later",
					value: Math.max(rows.length - dueThisWeek.length, 0),
					color: "var(--chart-4)",
				},
			],
		},
		{
			title: "Due This Week",
			value: `${dueThisWeek.length}`,
			subtitle:
				dueThisWeek.length > 0
					? `${dueThisWeek[0].daysUntilInspection} days until the next scheduled inspection`
					: "No inspections due soon",
			showProgressBar: false,
			segments: dueThisWeek.slice(0, 2).map((inspection, index) => ({
				label: inspection.unitName,
				description: inspection.title,
				value: inspection.daysUntilInspection,
				color: index === 0 ? "var(--chart-1)" : "var(--chart-3)",
			})),
			formatSegmentValue: (segment) => `${segment.value}d`,
		},
		{
			title: "Next Inspection",
			value: nextInspection ? `${nextInspection.daysUntilInspection}d` : "-",
			subtitle: nextInspection
				? `${nextInspection.unitName} · ${nextInspection.title}`
				: "No inspections scheduled",
			showProgressBar: false,
		},
		{
			title: "Units Covered",
			value: `${uniqueUnits}`,
			subtitle: "Unique units with upcoming inspections",
			showProgressBar: false,
		},
	];

	return <KpiCard cards={cards} />;
}
