import UnitHeader from "./_components/unit-header";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc";
import { CurrentLeaseCard } from "./_components/current-lease-card";
import { UtilityCard } from "@/components/utility-overview-card/utility-card";
import { getServerRole } from "@/lib/get-server";
import { notFound } from "next/navigation";
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

	await queryClient.prefetchQuery(orpc.unit.list.queryOptions({ input: {} }));
	await queryClient.prefetchQuery(
		orpc.utility.list.queryOptions({ input: { unitId: id, status: "active" } }),
	);
	await queryClient.prefetchQuery(
		orpc.inspection.list.queryOptions({ input: { unitId: id } }),
	);

	return (
		<HydrateClient client={queryClient}>
			<div className="flex-1 space-y-6 px-6 pt-0">
				<UnitHeader id={id} />

				<div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
					<CurrentLeaseCard id={id} />
					<UtilityCard id={id} role={role} />
					<InspectionsCard unitId={id} role={role} />
				</div>
			</div>
		</HydrateClient>
	);
}
