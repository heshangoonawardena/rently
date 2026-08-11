"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
	CircleHelp,
	Copy,
	Edit,
	MoreHorizontal,
	Trash2,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { UTILITY_TYPE_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { AddUtilityModal } from "./add-utility-modal";
import { DeleteUtilityModal } from "./delete-utility-modal";
import { EditUtilityModal } from "./edit-utility-modal";

type UtilityCardProps = {
	id: number;
	role: Role;
};

export function UtilityCard({ id, role }: UtilityCardProps) {
	const {
		data: { items: utilities },
	} = useSuspenseQuery(
		orpc.utility.list.queryOptions({ input: { unitId: id, status: "active" } }),
	);

	const activeCount = utilities.filter((u) => u.status === "active").length;

	if (utilities.length === 0) {
		return (
			<Card className="h-fit">
				<CardHeader className="flex flex-row items-start justify-between">
					<div>
						<CardTitle>Utility Accounts</CardTitle>
						<CardDescription>Accounts linked to this property</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className="bg-chart-2 text-white capitalize"
						>
							{activeCount} Active
						</Badge>

						{role !== "tenant" && <AddUtilityModal unitId={id} />}
					</div>
				</CardHeader>

				<CardContent className="space-y-4 max-h-96 overflow-auto">
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
						<Zap className="mb-3 size-8 text-muted-foreground" />
						<p className="font-medium">No utility accounts</p>
						<p className="mt-1 max-w-xs text-sm text-muted-foreground">
							This unit has no utilities yet..
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
					<CardTitle>Utility Accounts</CardTitle>
					<CardDescription>Accounts linked to this property</CardDescription>
				</div>

				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="bg-chart-2 text-white capitalize"
					>
						{activeCount} Active
					</Badge>

					{role !== "tenant" && <AddUtilityModal unitId={id} />}
				</div>
			</CardHeader>

			<CardContent className="space-y-4 max-h-96 overflow-auto">
				{utilities.map((utility, index) => {
					const selectedOption =
						UTILITY_TYPE_FILTER_OPTIONS.find(
							(option) => option.value === utility.utilityType,
						) ??
						UTILITY_TYPE_FILTER_OPTIONS[UTILITY_TYPE_FILTER_OPTIONS.length - 1];
					const Icon = selectedOption.icon ?? CircleHelp;

					return (
						<div key={utility.id}>
							<div className="flex items-start gap-3">
								<div className="rounded-lg bg-muted p-2">
									<Icon className={`size-5 ${selectedOption.color}`} />
								</div>

								<div className="flex-1 space-y-2">
									<div className="flex items-center justify-between gap-2">
										<h4 className="font-medium capitalize">
											{utility.utilityType}
										</h4>

										<div className="flex items-center gap-2">
											<Badge
												className={
													utility.status === "active"
														? "bg-chart-2 text-white capitalize"
														: utility.status === "inactive"
															? "bg-chart-4 text-white capitalize"
															: "capitalize"
												}
											>
												{utility.status}
											</Badge>

											{role !== "tenant" && (
												<div>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="outline" size="sm">
																<MoreHorizontal className="size-4 mr-2" />
																Actions
															</Button>
														</DropdownMenuTrigger>

														<DropdownMenuContent align="end">
															<EditUtilityModal data={utility}>
																<DropdownMenuItem
																	onSelect={(e) => e.preventDefault()}
																>
																	<Edit className="mr-2 size-4" />
																	Edit Utility
																</DropdownMenuItem>
															</EditUtilityModal>

															<DeleteUtilityModal
																unitId={id}
																utilityId={utility.id}
																utilityType={utility.utilityType}
															>
																<DropdownMenuItem
																	onSelect={(e) => e.preventDefault()}
																	className="text-destructive"
																>
																	<Trash2 className="mr-2 size-4 text-destructive" />
																	Delete Utility
																</DropdownMenuItem>
															</DeleteUtilityModal>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
										<div>
											<p className="text-muted-foreground">Account Number</p>
											<div className="flex items-center gap-2 font-medium">
												<span>{utility.accountNumber}</span>
												<button
													type="button"
													onClick={() =>
														navigator.clipboard.writeText(utility.accountNumber)
													}
													className="rounded-sm p-1 hover:bg-muted"
													aria-label="Copy Acount Number"
													title="Copy Account Number"
												>
													<Copy className="size-3.5" />
												</button>
											</div>
										</div>

										<div>
											<p className="text-muted-foreground">Holder</p>
											<p className="font-medium">{utility.holderName}</p>
										</div>

										<div>
											<p className="text-muted-foreground">Address</p>
											<p>{utility.address}</p>
										</div>

										{utility.description && (
											<div>
												<p className="text-muted-foreground">Description</p>
												<p>{utility.description}</p>
											</div>
										)}
									</div>
								</div>
							</div>
							{index < utilities.length - 1 && <Separator className="mt-4" />}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
