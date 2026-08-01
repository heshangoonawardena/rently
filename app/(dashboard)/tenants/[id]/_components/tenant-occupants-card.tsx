"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Users, CreditCard, MoreHorizontal } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { AddOccupantModal } from "./add-occupant-modal";
import { DeleteOccupantButton } from "./delete-occupant-modal";
import { Role } from "@/types/role";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type TenantOccupantsCardProps = {
	id: number;
	role: Role;
};

export function TenantOccupantsCard({ id, role }: TenantOccupantsCardProps) {
	const { data: occupantsItems } = useSuspenseQuery(
		orpc.tenant.listOccupants.queryOptions({
			input: { tenantId: id, status: "active" },
		}),
	);

	const occupants = occupantsItems.items ?? null;

	if (occupants.length === 0) {
		return (
			<Card className="h-fit">
				<CardHeader className="flex flex-row items-start justify-between">
					<div>
						<CardTitle>Tenant Occupants</CardTitle>
						<CardDescription>People living with this tenant. </CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary">{occupants.length} Occupants</Badge>

						{role !== "tenant" && <AddOccupantModal tenantId={id} />}
					</div>
				</CardHeader>

				<CardContent className="space-y-4 max-h-96 overflow-auto">
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
						<Users className="mb-3 size-8 text-muted-foreground" />
						<p className="font-medium">No occupants</p>
						<p className="mt-1 max-w-xs text-sm text-muted-foreground">
							This tenant has no registered occupants.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-fit">
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle>Tenant Occupants</CardTitle>
					<CardDescription>People living with this tenant.</CardDescription>
				</div>

				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="bg-chart-2 text-white capitalize"
					>
						{occupants.length} Occupant
						{occupants.length !== 1 && "s"}
					</Badge>

					{role !== "tenant" && <AddOccupantModal tenantId={id} />}
				</div>
			</CardHeader>

			<CardContent className="space-y-4 max-h-96 overflow-auto">
				{occupants.map((occupant, index) => {
					const firstName = occupant.firstName?.trim();
					const lastName = occupant.lastName?.trim() || "";
					const occupantName = `${firstName} ${lastName}`.trim();

					return (
						<div key={occupant.id}>
							<div className="flex-1 space-y-2">
								<div className="flex items-start justify-between">
									<div>
										<h4 className="font-semibold">{occupantName}</h4>

										<p className="text-sm text-muted-foreground">
											{occupant.relationship?.trim()}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<Badge
											className={
												occupant.status === "active"
													? "bg-chart-2 text-white capitalize"
													: occupant.status === "evicted"
														? "bg-chart-4 text-white capitalize"
														: occupant.status === "inactive"
															? "bg-chart-4 text-white capitalize"
															: occupant.status === "pending"
																? "bg-chart-3 text-white capitalize"
																: "capitalize"
											}
										>
											{occupant.status?.trim()}
										</Badge>

										{role !== "tenant" && (
											<div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															className="cursor-pointer"
														>
															<MoreHorizontal className="size-4 mr-2" />
															Actions
														</Button>
													</DropdownMenuTrigger>

													<DropdownMenuContent align="end">
														<DeleteOccupantButton
															tenantId={id}
															occupantId={occupant.id}
															occupantName={occupantName}
														>
															<DropdownMenuItem
																onSelect={(e) => e.preventDefault()}
																className="text-destructive"
															>
																Delete
															</DropdownMenuItem>
														</DeleteOccupantButton>
													</DropdownMenuContent>

													{/* <DropdownMenuContent>
														<DeleteOccupantButton
															tenantId={id}
															occupantId={occupant.id}
															occupantName={occupantName}
														/>
													</DropdownMenuContent> */}
												</DropdownMenu>
											</div>
										)}
									</div>
								</div>

								<div className="grid gap-4 text-sm sm:grid-cols-2">
									<div className="flex items-center gap-2">
										<CreditCard className="h-4 w-4 text-muted-foreground" />
										<span>{occupant.nic?.trim() || "NIC not provided"}</span>
									</div>

									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<span>
											{occupant.phone?.trim() || "Phone not provided"}
										</span>
									</div>
								</div>
							</div>

							{index !== occupants.length - 1 && <Separator className="mt-5" />}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
