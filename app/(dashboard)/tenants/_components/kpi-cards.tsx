"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { KpiCard, type KpiCardData } from "@/components/kpi-card";
import { orpc } from "@/lib/orpc";

function _formatLkr(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currencyDisplay: "narrowSymbol",
		currency: "LKR",
	}).format(Number(value));
}

export default function KpiCards() {
	const [{ data: occupancy }, { data: leases }] = useSuspenseQueries({
		queries: [
			orpc.report.occupancySummary.queryOptions(),
			orpc.report.expiringLeases.queryOptions({ input: { daysAhead: 60 } }),
		],
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
		{
			title: "Near Expiring Leases",
			value: `${leases.rows.length} leases`,
			subtitle:
				leases.rows.length > 0
					? `${leases.rows[0].daysUntilExpiry} days until nearest expiry`
					: "No leases expiring soon",
			showProgressBar: false,
			segments: leases.rows.slice(0, 2).map((lease, index) => ({
				label: lease.unitName,
				description: lease.tenantName,
				value: lease.daysUntilExpiry,
				color: index === 0 ? "var(--chart-1)" : "var(--chart-3)",
			})),
			formatSegmentValue: (segment) => `${segment.value} days`,
		},
	];

	return <KpiCard cards={cards} />;
}
