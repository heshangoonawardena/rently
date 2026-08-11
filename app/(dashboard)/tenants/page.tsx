import { getServerRole } from "@/lib/get-server";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import KpiCards from "./_components/kpi-cards";
import QuickActions from "./_components/quick-actions";
import TenantsTable from "./_components/tenants-table";

export default async function Page() {
	const queryClient = getQueryClient();
	const initialRefreshedAt = new Date().toISOString();
	const role = await getServerRole();

	await queryClient.prefetchQuery(orpc.report.occupancySummary.queryOptions());
	await queryClient.prefetchQuery(
		orpc.report.rentCollection.queryOptions({ input: {} }),
	);
	await queryClient.prefetchQuery(
		orpc.report.expiringLeases.queryOptions({ input: {} }),
	);
	await queryClient.prefetchQuery(
		orpc.tenant.list.queryOptions({
			input: { limit: 10, cursor: undefined },
		}),
	);

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				{/* Page Header */}

				<div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
						<p className="text-muted-foreground">
							Manage all tenant agreements
						</p>
					</div>
					<QuickActions initialRefreshedAt={initialRefreshedAt} />
				</div>

				<KpiCards />
				<TenantsTable role={role} />
			</div>
		</HydrateClient>
	);
}
