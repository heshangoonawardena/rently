import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import { LeaseHeader } from "./_components/lease-header";
import { LeaseOverviewCard } from "./_components/lease-overview-card";
import { UtilityCard } from "@/components/utility-overview-card/utility-card";
import { getServerRole } from "@/lib/get-server";
import { TenantOverviewCard } from "./_components/tenant-overview-card";
import { notFound } from "next/navigation";
import LeasePaymentsTable from "./_components/lease-payments/lease-payments-table";
import { InspectionsCard } from "@/components/inspection-overview-card/inspection-card";

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const queryClient = getQueryClient();
	const role = await getServerRole();
	const { id: rawId } = await params;
	const id = Number(rawId);

	if (!Number.isInteger(id) || id <= 0) {
		notFound();
	}

	// await queryClient.prefetchQuery(
	// 	orpc.lease.get.queryOptions({ input: { id } }),
	// );
	// await queryClient.prefetchQuery(
	// 	orpc.payment.list.queryOptions({
	// 		input: {
	// 			leaseId: id,
	// 			limit: 100,
	// 		},
	// 	}),
	// );

	await Promise.all([
		queryClient.prefetchQuery(orpc.lease.get.queryOptions({ input: { id } })),
		queryClient.prefetchQuery(
			orpc.payment.list.queryOptions({ input: { leaseId: id, limit: 100 } }),
		),
	]);

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				<LeaseHeader id={id} role={role} />
				<LeasePaymentsTable leaseId={id} />

				<div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
					<LeaseOverviewCard id={id} role={role} />
					<TenantOverviewCard leaseId={id} role={role} />
					<UtilityCard id={id} role={role} />
					<InspectionsCard leaseId={id} role={role} />
				</div>
			</div>
		</HydrateClient>
	);
}
