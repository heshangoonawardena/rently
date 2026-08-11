import { notFound } from "next/navigation";
import { getServerRole } from "@/lib/get-server";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { TenantHeader } from "./_components/tenant-header";
import { TenantLeasesCard } from "./_components/tenant-leases-card";
import { TenantOccupantsCard } from "./_components/tenant-occupants-card";
import { TenantOverviewCard } from "./_components/tenant-overview-card";

export default async function Page({
	params,
}: {
	params: Promise<{ id: number }>;
}) {
	const queryClient = getQueryClient();
	const role = await getServerRole();
	const { id: rawId } = await params;
	const id = Number(rawId);

	if (!Number.isInteger(id) || id <= 0) {
		notFound();
	}

	await queryClient.prefetchQuery(
		orpc.tenant.get.queryOptions({ input: { id } }),
	);
	await queryClient.prefetchQuery(
		orpc.tenant.listOccupants.queryOptions({
			input: { tenantId: id, status: "active" },
		}),
	);
	await queryClient.prefetchQuery(
		orpc.lease.list.queryOptions({ input: { tenantId: id } }),
	);

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				<TenantHeader id={id} role={role} />

				<div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
					<TenantOverviewCard id={id} />
					<TenantOccupantsCard id={id} role={role} />
				</div>

				<TenantLeasesCard id={id} />
			</div>
		</HydrateClient>
	);
}
