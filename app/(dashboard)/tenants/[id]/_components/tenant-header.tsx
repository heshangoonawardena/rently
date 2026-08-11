"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Copy,
	Download,
	FileText,
	IdCard,
	MapPin,
	Phone,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { EditTenantModal } from "../../_components/edit-tenant-modal";

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
								<Phone className="size-4 shrink-0" />

								<Link
									href={`tel:${tenant.phoneNumber}`}
									className="flex-1  hover:underline"
									title={`Call ${tenant.firstName}`}
								>
									{tenant.phoneNumber}
								</Link>
							</div>

							<div className="flex items-center gap-2">
								<IdCard className="size-4" />
								<span>{tenant.nic}</span>
								<button
									type="button"
									onClick={() => navigator.clipboard.writeText(tenant.nic)}
									className="rounded-sm p-1 hover:bg-muted"
									aria-label="Copy NIC"
									title="Copy NIC"
								>
									<Copy className="size-3.5" />
								</button>
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
						<EditTenantModal data={tenant} />
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								<Settings className="size-4 mr-2" />
								Actions
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>
								<FileText className="size-4 mr-2" />
								Generate Report
							</DropdownMenuItem>
							<DropdownMenuItem>
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
