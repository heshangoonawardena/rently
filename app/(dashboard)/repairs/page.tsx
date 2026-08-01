import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import QuickActions from "./_components/quick-actions";
import RepairsTable from "./_components/repairs-table";
import { getServerRole } from "@/lib/get-server";

export default async function Page() {
	const role = await getServerRole();

	const queryClient = getQueryClient();
	await queryClient.prefetchQuery(orpc.repair.list.queryOptions({ input: {} }));
	// await queryClient.prefetchQuery(orpc.report.occupancySummary.queryOptions());

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				{/* Page Header */}

				<div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-bold tracking-tight">Repairs</h1>
						<p className="text-muted-foreground">Manage all repairs</p>
					</div>
					<QuickActions />
				</div>

				{/* <KpiCards /> */}
				<RepairsTable role={role} />
			</div>
		</HydrateClient>
	);
}
