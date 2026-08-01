"use client";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
	CalendarDays,
	User,
	Wallet,
	ShieldCheck,
	FileText,
	Plus,
} from "lucide-react";
import { format } from "date-fns";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import Link from "next/link";

export function CurrentLeaseCard({ id }: { id: number }) {
	const {
		data: { items },
	} = useSuspenseQuery(orpc.unit.list.queryOptions({ input: { id: id } }));

	const lease = items[0]?.activeLease;

	if (!lease) {
		return (
			<Card className="h-fit">
				<CardHeader className="flex flex-row items-start justify-between">
					<div>
						<CardTitle>Current Lease</CardTitle>
						<CardDescription>
							Active lease information for this property
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className="space-y-4 max-h-96 overflow-auto">
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
						<FileText className="mb-3 size-8 text-muted-foreground" />
						<p className="font-medium">No active lease</p>
						<p className="mt-1 max-w-xs text-sm text-muted-foreground">
							This unit has no active leases yet.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const daysRemaining =
		lease.endDate === null
			? null
			: Math.max(
					Math.ceil(
						(new Date(lease.endDate).getTime() - Date.now()) /
							(1000 * 60 * 60 * 24),
					),
					0,
				);

	return (
		<Card className="h-fit">
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle>Current Lease</CardTitle>
					<CardDescription>
						Active lease information for this unit
					</CardDescription>
				</div>

				<Badge
					className={
						lease.status === "active"
							? "bg-chart-2 text-white capitalize"
							: lease.status === "ended"
								? "bg-chart-1 text-white capitalize"
								: lease.status === "extended"
									? "bg-chart-4 text-white capitalize"
									: lease.status === "terminated"
										? "bg-chart-4 text-white capitalize"
										: "capitalize"
					}
				>
					{lease.status}
				</Badge>
			</CardHeader>

			<CardContent className="space-y-4 max-h-96 overflow-auto">
				{/* Tenant */}
				<div className="flex items-start gap-3">
					<User className="mt-1 size-5 text-muted-foreground" />

					<div>
						<p className="font-medium">
							{lease.tenant.nickname
								? `${lease.tenant.nickname} - (${lease.tenant.firstName} ${lease.tenant.lastName ?? ""})`
								: `${lease.tenant.firstName} ${lease.tenant.lastName ?? ""}`}
						</p>

						<p className="text-sm text-muted-foreground">{lease.tenant.nic}</p>

						<p className="text-sm text-muted-foreground">
							{lease.tenant.phoneNumber}
						</p>
					</div>
				</div>

				<Separator />

				<div className="grid gap-5 grid-cols-2">
					<div>
						<p className="text-sm text-muted-foreground">Lease Start</p>

						<div className="mt-1 flex items-center gap-2 font-medium">
							<CalendarDays className="size-4" />
							{format(new Date(lease.startDate), "dd MMM yyyy")}
						</div>
					</div>

					<div>
						<p className="text-sm text-muted-foreground">Lease End</p>

						<div className="mt-1 flex items-center gap-2 font-medium">
							<CalendarDays className="size-4" />
							{lease.endDate
								? format(new Date(lease.endDate), "dd MMM yyyy")
								: "No End Date"}
						</div>

						{daysRemaining !== null && (
							<p className="mt-1 text-xs text-chart-1">
								{daysRemaining} days remaining
							</p>
						)}
					</div>

					<div>
						<p className="text-sm text-muted-foreground">Monthly Rent</p>

						<div className="mt-1 flex items-center gap-2 text-lg font-semibold">
							<Wallet className="size-4" />
							{lease.currentRent
								? `LKR ${lease.currentRent.rentAmount.toLocaleString()}`
								: "Not set"}
						</div>
					</div>

					<div>
						<p className="text-sm text-muted-foreground">Security Deposit</p>

						<div className="mt-1 flex items-center gap-2 font-medium">
							<ShieldCheck className="size-4" />
							LKR {lease.depositAmount.toLocaleString()}
						</div>
					</div>

					<div>
						<p className="text-sm text-muted-foreground">Rent Effective From</p>

						<p className="font-medium">
							{lease.currentRent
								? format(
										new Date(lease.currentRent.effectiveDate),
										"dd MMM yyyy",
									)
								: "N/A"}
						</p>
					</div>

					<div>
						<p className="text-sm text-muted-foreground">Monthly Due Day</p>

						<p className="font-medium">
							{lease.currentRent
								? `On or before day ${lease.currentRent.agreedPaymentDay}`
								: "N/A"}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-end">
					<Link href={`/leases/${lease.id}`}>
						<Button variant="outline" size="sm">
							View Lease
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
