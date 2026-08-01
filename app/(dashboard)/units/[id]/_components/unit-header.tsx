"use client";

import { ArrowLeft, Settings, FileText, Download, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { orpc } from "@/lib/orpc";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Card, CardContent } from "@/components/ui/card";
import { useSuspenseQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { EditUnitModal } from "../../_components/edit-unit-modal";
import { Home, Warehouse, Bed, Map } from "lucide-react";

export default function UnitHeader({ id }: { id: number }) {
	const [{ data: unitItems }, { data: repairs }, { data: inspectionItems }] =
		useSuspenseQueries({
			queries: [
				orpc.unit.list.queryOptions({ input: { id: id } }),
				orpc.repair.list.queryOptions({
					input: { unitId: id, status: "open" },
				}),
				orpc.inspection.list.queryOptions({ input: { unitId: id } }),
			],
		});

	const unit = unitItems.items[0] ?? null;
	const inspection = inspectionItems.items[0] ?? null;

	if (!unit) {
		return (
			<div className="flex flex-col gap-4">
				<Button variant="ghost" size="sm" className="mr-auto" asChild>
					<Link href="/units">
						<ArrowLeft />
						Back to Units
					</Link>
				</Button>

				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<div className="text-center">
							<h2 className="text-lg font-semibold">Unit not found</h2>
							<p className="text-sm text-muted-foreground mt-1">
								The requested unit does not exist or may have been deleted.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const initials = `${unit.name[0] ?? ""}`;

	const unitTypeIcons = {
		house: Home,
		warehouse: Warehouse,
		room: Bed,
		land: Map,
	};

	const Icon =
		unitTypeIcons[unit.type.toLowerCase() as keyof typeof unitTypeIcons];

	return (
		<div className="space-y-6">
			<Button asChild variant="ghost" size="sm" className="mr-auto">
				<Link href="/units">
					<ArrowLeft className="mr-2 size-4" />
					Back to Units
				</Link>
			</Button>

			<div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
				<div className="flex gap-4">
					<Avatar className="size-16">
						<AvatarFallback className="text-lg font-semibold">
							<Icon className="size-fit" />
						</AvatarFallback>
					</Avatar>

					<div className="space-y-2 space-x-2">
						<div>
							<h1 className="text-2xl font-bold tracking-tight">{unit.name}</h1>

							{unit.description && (
								<p className="text-muted-foreground">{unit.description}</p>
							)}
						</div>
						<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							{unit.address && (
								<div className="flex items-center gap-2">
									<MapPin className="size-4" />
									{unit.address}
								</div>
							)}
						</div>

						<Badge
							className={
								unit.status === "available"
									? "bg-chart-1 text-white capitalize"
									: unit.status === "inactive"
										? "bg-chart-4 text-white capitalize"
										: unit.status === "maintenance"
											? "bg-chart-3 text-white capitalize"
											: unit.status === "occupied"
												? "bg-chart-2 text-white capitalize"
												: "capitalize"
							}
						>
							{unit.status}
						</Badge>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<div>
						<EditUnitModal data={unit} triggerVariant="default" />
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

			<Card>
				<CardContent className="space-y-6 p-6">
					{/* Summary */}
					<div className="grid gap-4 md:grid-cols-4 grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Added On</p>

							<p className="font-semibold">
								{format(unit.createdAt, "dd MMM yyyy")}
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">
								Utility Billing Mode
							</p>

							<p className="font-semibold capitalize">
								{unit.utilityBillingMode.replace("_", " ")}
							</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground capitalize">
								Repairs
							</p>

							<p className="font-semibold">{repairs.items.length} Open</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Next Inspection</p>

							{inspection ? (
								<div className="mt-1 flex items-center gap-2">
									<Badge
										className={
											inspection.status === "scheduled"
												? "bg-chart-1 text-white capitalize"
												: inspection.status === "rescheduled"
													? "bg-chart-4 text-white capitalize"
													: inspection.status === "cancelled"
														? "bg-chart-1 text-white capitalize"
														: inspection.status === "completed"
															? "bg-chart-2 text-white capitalize"
															: inspection.status === "skipped"
																? "bg-chart-1 text-white capitalize"
																: "capitalize"
										}
									>
										{inspection.status}
									</Badge>

									<span className="font-semibold">
										{format(inspection.scheduledDate, "dd MMM yyyy")}
									</span>
								</div>
							) : (
								<p className="font-semibold text-muted-foreground">
									No inspections scheduled
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
