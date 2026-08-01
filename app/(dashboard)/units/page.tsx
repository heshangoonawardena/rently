import KpiCards from "./_components/kpi-cards";
import UnitsTable from "./_components/units-table";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import QuickActions from "./_components/quick-actions";
import { getServerRole } from "@/lib/get-server";

export default async function Page() {
	const queryClient = getQueryClient();
	const role = await getServerRole();

	await queryClient.prefetchQuery(orpc.unit.list.queryOptions({ input: {} }));
	await queryClient.prefetchQuery(orpc.report.occupancySummary.queryOptions());

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				{/* Page Header */}

				<div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-bold tracking-tight">Units</h1>
						<p className="text-muted-foreground">
							Manage all properties and spaces
						</p>
					</div>
					<QuickActions />
				</div>

				<KpiCards />
				<UnitsTable role={role} />
			</div>
		</HydrateClient>
	);
}
