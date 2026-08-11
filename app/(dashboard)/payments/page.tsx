import { getServerRole } from "@/lib/get-server";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import PaymentsTable from "./_components/payments-table";
import QuickActions from "./_components/quick-actions";

export default async function Page() {
	const queryClient = getQueryClient();
	const initialRefreshedAt = new Date().toISOString();
	const role = await getServerRole();
	const initialPageSize = 10;

	await queryClient.prefetchQuery(
		orpc.payment.list.queryOptions({ input: { limit: initialPageSize } }),
	);

	return (
		<div className="flex-1 space-y-6 px-6 pt-0">
			<div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-bold tracking-tight">Payments</h1>
					<p className="text-muted-foreground">Manage all payments</p>
				</div>
				<QuickActions role={role} initialRefreshedAt={initialRefreshedAt} />
			</div>

			<HydrateClient client={queryClient}>
				<PaymentsTable />
			</HydrateClient>
		</div>
	);
}
