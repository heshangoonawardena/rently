"use client";

import { useQuery } from "@tanstack/react-query";
import { KpiCard, type KpiCardData } from "@/components/kpi-card";
import { orpc } from "@/lib/orpc";

function formatLkr(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currencyDisplay: "narrowSymbol",
		currency: "LKR",
	}).format(Number(value));
}

function safeRatioPct(part: number, total: number): number {
	if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
		return 0;
	}
	return Math.round((part / total) * 100);
}

export default function KpiCards() {
	const occupancyQuery = useQuery(orpc.report.occupancySummary.queryOptions());
	const rentQuery = useQuery(
		orpc.report.rentCollection.queryOptions({ input: {} }),
	);
	const arrearsQuery = useQuery(orpc.report.arrearsOverview.queryOptions());
	const repairsQuery = useQuery(
		orpc.report.repairSummary.queryOptions({ input: {} }),
	);

	const isLoading = [
		occupancyQuery,
		rentQuery,
		arrearsQuery,
		repairsQuery,
	].some((query) => query.isLoading || query.isFetching);

	const occupancy = occupancyQuery.data ?? {
		occupancyRate: 0,
		available: 0,
		total: 1,
		occupied: 0,
		maintenance: 0,
		inactive: 0,
	};
	const rent = rentQuery.data ?? {
		totalCollected: 0,
		totalExpected: 0,
		totalOutstanding: 0,
	};
	const arrears = arrearsQuery.data ?? {
		totalArrears: 0,
		tenantsInTotal: 0,
		tenantsInArrears: 0,
	};
	const repairs = repairsQuery.data ?? {
		open: 0,
		inProgress: 0,
		resolved: 0,
		cancelled: 0,
	};

	const totalRepairs = repairs.open + repairs.inProgress + repairs.resolved;
	const healthyTenants = Math.max(
		arrears.tenantsInTotal - arrears.tenantsInArrears,
		0,
	);

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
			title: "Rent Collection",
			value: formatLkr(rent.totalCollected ?? 0),
			subtitle: `${safeRatioPct(rent.totalCollected ?? 0, rent.totalExpected ?? 0)}% collected`,
			segments: [
				{
					label: "Collected",
					value: rent.totalCollected ?? 0,
					color: "var(--chart-2)",
				},
				{
					label: "Outstanding",
					value: rent.totalOutstanding ?? 0,
					color: "var(--chart-1)",
				},
			],
		},
		{
			title: "Arrears",
			value: formatLkr(arrears.totalArrears ?? 0),
			subtitle: `${arrears.tenantsInArrears} tenant${arrears.tenantsInArrears !== 1 ? "s" : ""}`,
			segments: [
				{ label: "Healthy", value: healthyTenants, color: "var(--chart-2)" },
				{
					label: "At Risk",
					value: arrears.tenantsInArrears,
					color: "var(--chart-1)",
				},
			],
		},
		{
			title: "Repairs",
			value: `${repairs.resolved}/${totalRepairs}`,
			subtitle: `${repairs.inProgress} in progress`,
			segments: [
				{ label: "Open", value: repairs.open, color: "var(--chart-1)" },
				{
					label: "In Progress",
					value: repairs.inProgress,
					color: "var(--chart-3)",
				},
				{ label: "Resolved", value: repairs.resolved, color: "var(--chart-2)" },
			],
		},
	];

	return <KpiCard cards={cards} isLoading={isLoading} />;
}
