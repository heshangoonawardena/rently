"use client";

import { Home } from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { LeaseCard } from "./lease-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export function TenantLeasesCard({ id }: { id: number }) {
	const { data: leaseItems } = useSuspenseQuery(
		orpc.lease.list.queryOptions({ input: { tenantId: id } }),
	);

	const leases = leaseItems.items ?? null;

	const activeLeases = leases.filter(
		(lease) => lease.status === "active",
	).length;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<CardTitle>Leases</CardTitle>
					<CardDescription>
						Current and previous leases assigned to this tenant
					</CardDescription>
				</div>

				<Badge className={"bg-chart-2 text-white capitalize"}>
					{activeLeases} Active
				</Badge>
			</CardHeader>

			<CardContent>
				{leases.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
						<Home className="mb-4 h-10 w-10 text-muted-foreground" />

						<h3 className="text-lg font-semibold">No leases found</h3>

						<p className="mt-2 max-w-sm text-sm text-muted-foreground">
							This tenant has not been assigned to any units yet.
						</p>
					</div>
				) : (
					<div className="grid gap-4 lg:grid-cols-2">
						{leases.map((lease) => (
							<LeaseCard key={lease.id} lease={lease} />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
