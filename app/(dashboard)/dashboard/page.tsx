import KpiCards from "./_components/kpi-cards";
import RecentTransactions from "./_components/recent-transactions";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import PropertyOccupancy from "./_components/property-occupancy";
import MaintenanceOverview from "./_components/maintenance-overview";
import UpcomingInspections from "./_components/upcoming-inspections";
import QuickActions from "./_components/quick-actions";

export default async function Page() {
	const queryClient = getQueryClient();

	// usePrefetchQuery
	await queryClient.prefetchQuery(orpc.report.occupancySummary.queryOptions());
	await queryClient.prefetchQuery(
		orpc.report.rentCollection.queryOptions({ input: {} }),
	);
	await queryClient.prefetchQuery(orpc.report.arrearsOverview.queryOptions());
	await queryClient.prefetchQuery(
		orpc.report.repairSummary.queryOptions({ input: {} }),
	);
	await queryClient.prefetchQuery(
		orpc.report.paymentOverview.queryOptions({ input: { limit: 4 } }),
	);
	await queryClient.prefetchQuery(
		orpc.report.expiringLeases.queryOptions({ input: {} }),
	);
	await queryClient.prefetchQuery(
		orpc.report.upcomingInspections.queryOptions({ input: { limit: 4 } }),
	);

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				<div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
						<p className="text-muted-foreground">
							Monitor your rental portfolio
						</p>
					</div>
					<QuickActions />
				</div>

				<KpiCards />

				<div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
					<RecentTransactions />
					<PropertyOccupancy />
					<MaintenanceOverview />
					<UpcomingInspections />
				</div>
			</div>
		</HydrateClient>
	);
}
