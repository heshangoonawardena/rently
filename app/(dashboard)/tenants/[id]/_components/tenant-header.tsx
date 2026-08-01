"use client";

import Link from "next/link";
import {
	ArrowLeft,
	Phone,
	Settings,
	FileText,
	Download,
	MapPin,
	IdCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { orpc } from "@/lib/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EditTenantModal } from "../../_components/edit-tenant-modal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role } from "@/types/role";

type TenantHeaderProps = {
	id: number;
	role: Role;
};

export function TenantHeader({ id, role }: TenantHeaderProps) {
	const { data: tenant } = useSuspenseQuery(
		orpc.tenant.get.queryOptions({ input: { id: id } }),
	);

	const initials = `${tenant.firstName[0] ?? ""}${tenant.lastName?.[0] ?? ""}`;

	return (
		<div className="space-y-6">
			<Button asChild variant="ghost" size="sm" className="mr-auto">
				<Link href="/tenants">
					<ArrowLeft className="mr-2 size-4" />
					Back to Tenants
				</Link>
			</Button>

			{/* Header */}
			<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
				<div className="flex gap-4">
					<Avatar className="size-16">
						<AvatarFallback className="text-lg font-semibold">
							{initials}
						</AvatarFallback>
					</Avatar>

					<div className="space-y-2 space-x-2">
						<div>
							<h1 className="text-2xl font-bold tracking-tight">
								{tenant.firstName} {tenant?.lastName}
							</h1>

							{tenant.nickname && role !== "tenant" && (
								<p className="text-muted-foreground">{tenant.nickname}</p>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<Phone className="size-4" />
								{tenant.phoneNumber}
							</div>

							<div className="flex items-center gap-2">
								<IdCard className="size-4" />
								{tenant.nic}
							</div>

							{tenant.address && (
								<div className="flex items-center gap-2">
									<MapPin className="size-4" />
									{tenant.address}
								</div>
							)}
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
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<div>
						<EditTenantModal data={tenant} triggerVariant="default" />
					</div>
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
		</div>
	);
}
