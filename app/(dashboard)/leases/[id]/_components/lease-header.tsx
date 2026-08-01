"use client";

import Link from "next/link";
import {
	ArrowLeft,
	User,
	MapPin,
	Settings,
	FileText,
	Download,
	ArrowRight,
	Home,
	Warehouse,
	Bed,
	Map,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { EditLeaseModal } from "../../_components/edit-lease-modal";
import { Role } from "@/types/role";

type LeaseHeaderProps = {
	id: number;
	role: Role;
};

export function LeaseHeader({ id, role }: LeaseHeaderProps) {
	const { data: lease } = useSuspenseQuery(
		orpc.lease.get.queryOptions({ input: { id: id } }),
	);

	const rent = lease.currentRent?.rentAmount ?? 0;
	const deposit = lease.depositAmount ?? 0;

	const formatter = new Intl.NumberFormat("en-LK", {
		style: "currency",
		currency: "LKR",
		maximumFractionDigits: 0,
	});

	const formatDate = (date: string | null) =>
		date
			? new Date(date).toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				})
			: "Ongoing";

	const unitTypeIcons = {
		house: Home,
		warehouse: Warehouse,
		room: Bed,
		land: Map,
	};

	const Icon =
		unitTypeIcons[lease.unit.type.toLowerCase() as keyof typeof unitTypeIcons];

	const createdAtMs = new Date(lease.createdAt).getTime();
	const isEditLocked =
		Number.isFinite(createdAtMs) && Date.now() - createdAtMs > 10 * 60 * 1000;

	return (
		<div className="space-y-6">
			<Button asChild variant="ghost" size="sm" className="mr-auto">
				<Link href="/leases">
					<ArrowLeft className="mr-2 size-4" />
					Back to Leases
				</Link>
			</Button>

			{/* Header */}
			<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
				<div className="flex gap-4">
					<Avatar className="size-16">
						<AvatarFallback className="text-lg font-semibold">
							<Icon className="size-fit" />
						</AvatarFallback>
					</Avatar>

					<div className="space-y-2 space-x-2">
						<div>
							<h1 className="text-2xl font-bold tracking-tight">
								{lease.unit.name}
							</h1>

							<div className="flex items-center gap-2">
								<User className="size-4" />
								{role !== "tenant" ? (
									<>
										{lease.tenant?.nickname} - ({lease.tenant.firstName}{" "}
										{lease.tenant?.lastName})
									</>
								) : (
									<>
										{lease.tenant.firstName} {lease.tenant?.lastName}
									</>
								)}
							</div>
						</div>

						<div className="flex items-center 	text-sm text-muted-foreground gap-2">
							<MapPin className="size-4" />
							{lease.unit.address}
						</div>

						<Badge
							className={
								lease.status === "active"
									? "bg-chart-2 text-white capitalize"
									: lease.status === "ended"
										? "bg-chart-1 text-white capitalize"
										: lease.status === "extended"
											? "bg-chart-3 text-white capitalize"
											: lease.status === "terminated"
												? "bg-chart-3 text-white capitalize"
												: "capitalize"
							}
						>
							{lease.status}
						</Badge>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					{role !== "tenant" && !isEditLocked && (
						<div>
							<EditLeaseModal data={lease} triggerVariant="default" />
						</div>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="cursor-pointer">
								<Settings className="size-4 mr-2" />
								Actions
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem className="cursor-pointer">
								<FileText className="size-4 mr-2" />
								Generate Report
							</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer">
								<Download className="size-4 mr-2" />
								Export Data
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<Card>
				<CardContent className="space-y-6 p-6">
					{/* Summary */}
					<div className="grid gap-4 md:grid-cols-4 grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Added On</p>

							<p className="font-semibold">
								{format(lease.createdAt, "dd MMM yyyy")}
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Rent</p>

							<p className="font-semibold capitalize">
								{formatter.format(rent)}/ month
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground capitalize">
								Deposit
							</p>

							<p className="font-semibold">
								{formatter.format(Number(deposit))}
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Lease Period</p>
							<div className="flex gap-2 items-center">
								{formatDate(lease.startDate)}
								<ArrowRight />
								{lease.endDate ? formatDate(lease.endDate) : "No end date"}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
