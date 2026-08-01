"use client";

import { orpc } from "@/lib/orpc";
import { useSuspenseQueries } from "@tanstack/react-query";
import { KpiCard, type KpiCardData } from "@/components/kpi-card";

export default function KpiCards() {
	const [{ data: occupancy }] = useSuspenseQueries({
		queries: [orpc.report.occupancySummary.queryOptions()],
	});

	const cards: KpiCardData[] = [
		{
			title: "Occupancy",
			value: `${occupancy.occupancyRate}%`,
			subtitle: `${occupancy.available}/${occupancy.total} units available`,
			segments: [
				{
					label: "Occupied",
					value: occupancy.occupied,
					color: "var(--chart-2)",
				},
				{
					label: "Available",
					value: occupancy.available,
					color: "var(--chart-1)",
				},
			],
		},
	];

	return <KpiCard cards={cards} />;
}
