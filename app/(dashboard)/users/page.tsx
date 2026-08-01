import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import UsersTable from "./_components/users-table";

export default async function Page() {
	const queryClient = getQueryClient();

	await queryClient.prefetchQuery(orpc.user.list.queryOptions({ input: {} }));
	await queryClient.prefetchQuery(
		orpc.user.listAvailableTenants.queryOptions({ input: {} }),
	);

	return (
		<div className="flex-1 space-y-6 px-6 pt-0">
			<div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-bold tracking-tight">Users</h1>
					<p className="text-muted-foreground">
						Review signups, approve access, and assign tenant accounts.
					</p>
				</div>
			</div>

			<HydrateClient client={queryClient}>
				<UsersTable />
			</HydrateClient>
		</div>
	);
}
