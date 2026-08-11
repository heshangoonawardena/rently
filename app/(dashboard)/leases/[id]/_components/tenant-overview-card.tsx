"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Briefcase, CreditCard, Phone, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";

type TenantOverviewCardProps = {
	leaseId: number;
	role: Role;
};

export function TenantOverviewCard({ leaseId, role }: TenantOverviewCardProps) {
	const { data: lease } = useSuspenseQuery(
		orpc.lease.get.queryOptions({ input: { id: leaseId } }),
	);

	const tenant = lease.tenant;

	const { data: occupantsItems } = useSuspenseQuery(
		orpc.tenant.listOccupants.queryOptions({
			input: { tenantId: tenant.id, status: "active" },
		}),
	);

	const occupants = occupantsItems.items ?? null;

	return (
		<Card className="h-fit">
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle>Tenant Overview</CardTitle>
					<CardDescription>
						Personal information and contact details.
					</CardDescription>
				</div>
				<Badge
					className={
						tenant.status === "active"
							? "bg-chart-2 text-white capitalize"
							: tenant.status === "evicted"
								? "bg-chart-1 text-white capitalize"
								: tenant.status === "inactive"
									? "bg-chart-3 text-white capitalize"
									: tenant.status === "pending"
										? "bg-chart-3 text-white capitalize"
										: "capitalize"
					}
				>
					{tenant.status}
				</Badge>
			</CardHeader>

			<CardContent className="space-y-4 max-h-96 overflow-auto">
				<div className="grid gap-6 md:grid-cols-2">
					<InfoItem
						icon={<User className="size-4" />}
						label="Full Name"
						value={`${tenant.firstName} ${tenant.lastName}`}
					/>

					{role !== "tenant" && (
						<InfoItem
							icon={<User className="size-4" />}
							label="Nickname"
							value={tenant.nickname || "-"}
						/>
					)}

					<InfoItem
						icon={<CreditCard className="size-4" />}
						label="NIC"
						value={tenant.nic}
					/>

					<InfoItem
						icon={<Briefcase className="size-4" />}
						label="Occupation"
						value={tenant.occupation || "-"}
					/>

					<InfoItem
						icon={<Phone className="size-4" />}
						label="Phone Number"
						value={tenant.phoneNumber || "-"}
					/>

					<InfoItem
						icon={<Users className="size-4" />}
						label="Occupants Count"
						value={occupants.length}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
	return (
		<div className="flex gap-3">
			<div className="my-1 rounded-lg bg-muted p-2 text-muted-foreground flex items-center justify-center">
				{icon}
			</div>

			<div className="space-y-1">
				<p className="text-sm text-muted-foreground">{label}</p>

				<p className="font-medium capitalize wrap-break-word">{value}</p>
			</div>
		</div>
	);
}
