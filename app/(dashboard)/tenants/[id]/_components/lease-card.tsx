"use client";

import Link from "next/link";
import {
	ArrowRight,
	Bed,
	Calendar,
	Coins,
	Home,
	Map,
	MapPin,
	Wallet,
	Warehouse,
} from "lucide-react";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListTenantOutput } from "@/app/schemas/tenant.schema";
import { ListLeaseOutput } from "@/app/schemas/lease.schema";
import { cn } from "@/lib/utils";

interface LeaseCardProps {
	lease: ListLeaseOutput["items"][number];
}

const badgeVariant: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	active: "default",
	pending: "secondary",
	expired: "outline",
	terminated: "destructive",
};

export function LeaseCard({ lease }: LeaseCardProps) {
	const startDate = new Date(lease.startDate).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

	const endDate =
		lease.endDate === null
			? "No end date"
			: new Date(lease.endDate).toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				});

	const rent = lease.currentRent?.rentAmount ?? 0;

	const deposit = Number(lease.depositAmount).toLocaleString();

	const unitTypeIcons = {
		house: Home,
		warehouse: Warehouse,
		room: Bed,
		land: Map,
	};

	const Icon =
		unitTypeIcons[lease.unit.type.toLowerCase() as keyof typeof unitTypeIcons];

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-2">
						<CardTitle>{lease.unit.name}</CardTitle>

						<Badge variant="outline">
							{Icon && <Icon className="size-4" />}
							<span className="text-sm capitalize">{lease.unit.type}</span>
						</Badge>
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
				</div>

				<div className="flex items-start gap-2 text-sm text-muted-foreground">
					<MapPin className="mt-0.5 h-4 w-4 shrink-0" />
					<span>{lease.unit.address}</span>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-5">
				<Separator />

				<div className="grid grid-cols-2 gap-6">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Coins className="h-4 w-4" />
							<span className="text-sm">Monthly Rent</span>
						</div>

						<p className="text-lg font-semibold">LKR {rent.toLocaleString()}</p>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Wallet className="h-4 w-4" />
							<span className="text-sm">Deposit</span>
						</div>

						<p className="text-lg font-semibold">LKR {deposit}</p>
					</div>
				</div>

				<Separator />

				<div className="space-y-3">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Calendar className="h-4 w-4" />

						<span className="text-sm font-medium">Lease Period</span>
					</div>

					<div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3">
						<div>
							<p className="text-xs text-muted-foreground">Start</p>

							<p className="font-medium">{startDate}</p>
						</div>

						<ArrowRight className="h-4 w-4 text-muted-foreground" />

						<div className="text-right">
							<p className="text-xs text-muted-foreground">End</p>

							<p className="font-medium">{endDate}</p>
						</div>
					</div>
				</div>

				<Separator />

				<div className="grid grid-cols-2 gap-6">
					<div>
						<p className="text-sm text-muted-foreground">Utility Billing</p>

						<p className="mt-1 font-medium capitalize">
							{lease.unit.utilityBillingMode.replaceAll("_", " ")}
						</p>
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<Button asChild className="w-full" variant="outline">
					<Link href={`/leases/${lease.id}`}>
						<Home className="mr-2 h-4 w-4" />
						View Lease
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
