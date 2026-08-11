"use client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	CheckCircle2,
	CircleHelp,
	CircleX,
	ClipboardCheck,
	Edit,
	MoreHorizontal,
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
import { INSPECTION_STATUS_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import { AddInspectionModal } from "./add-inspection-modal";
import { DeleteInspectionModal } from "./delete-inspection-modal";
import { EditInspectionModal } from "./edit-inspection-modal";
import { MarkInspectionDoneModal } from "./mark-inspection-done-modal";

type InspectionCardProps = {
	unitId?: number;
	leaseId?: number;
	role: Role;
};
export function InspectionsCard({
	unitId: propUnitId,
	leaseId,
	role,
}: InspectionCardProps) {
	const { data: lease } = useQuery({
		...orpc.lease.get.queryOptions({
			input: { id: leaseId! },
		}),
		enabled: !propUnitId && !!leaseId,
	});

	const unitId = propUnitId ?? lease?.unitId;

	const {
		data: { items },
	} = useSuspenseQuery(
		orpc.inspection.list.queryOptions({
			input: {
				unitId: unitId,
			},
		}),
	);

	const inspections = items;

	if (inspections.length === 0) {
		return (
			<Card className="h-fit">
				<CardHeader className="flex flex-row items-start justify-between">
					<div>
						<CardTitle>Inspections</CardTitle>
						<CardDescription>Inspection history for this unit</CardDescription>
					</div>
					<div>
						{role !== "tenant" && <AddInspectionModal unitId={unitId} />}
					</div>
				</CardHeader>

				<CardContent className="space-y-4 max-h-96 overflow-auto">
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
						<ClipboardCheck className="mb-3 size-8 text-muted-foreground" />
						<p className="font-medium">No Inspections</p>
						<p className="mt-1 max-w-xs text-sm text-muted-foreground">
							This unit has no inspection records yet.
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
					<CardTitle>Inspections</CardTitle>
					<CardDescription>Inspection history for this unit</CardDescription>
				</div>

				{role !== "tenant" && <AddInspectionModal unitId={unitId} />}
			</CardHeader>

			<CardContent className="space-y-4 max-h-96 overflow-auto">
				{inspections.map((inspection, index) => {
					const selectedOption =
						INSPECTION_STATUS_FILTER_OPTIONS.find(
							(option) => option.value === inspection.status,
						) ??
						INSPECTION_STATUS_FILTER_OPTIONS[
							INSPECTION_STATUS_FILTER_OPTIONS.length - 1
						];
					const Icon = selectedOption.icon ?? CircleHelp;
					return (
						<div key={inspection.id}>
							<div className="flex items-start gap-3">
								<div className="rounded-lg bg-muted p-2">
									<Icon className={`size-5 ${selectedOption.color}`} />
								</div>

								<div className="flex-1 space-y-2">
									<div className="flex items-center justify-between gap-2">
										<h4 className="font-medium">{inspection.title}</h4>

										<div className="flex items-center gap-2">
											<Badge
												className={
													inspection.status === "completed"
														? "bg-chart-2 text-white capitalize"
														: inspection.status === "scheduled"
															? "bg-chart-4 text-white capitalize"
															: inspection.status === "rescheduled"
																? "bg-chart-4 text-white capitalize"
																: inspection.status === "skipped"
																	? "bg-chart-3 text-white capitalize"
																	: inspection.status === "cancelled"
																		? "bg-destructive text-white capitalize"
																		: "capitalize"
												}
											>
												{inspection.status}
											</Badge>

											{role !== "tenant" &&
												["scheduled", "rescheduled"].includes(
													inspection.status,
												) && (
													<div>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="outline" size="sm">
																	<MoreHorizontal className="size-4 mr-2" />
																	Actions
																</Button>
															</DropdownMenuTrigger>

															<DropdownMenuContent align="end">
																<EditInspectionModal data={inspection}>
																	<DropdownMenuItem
																		onSelect={(e) => e.preventDefault()}
																	>
																		<Edit className="mr-2 size-4" />
																		Edit Inspection
																	</DropdownMenuItem>
																</EditInspectionModal>

																<MarkInspectionDoneModal
																	inspection={inspection}
																>
																	<DropdownMenuItem
																		onSelect={(e) => e.preventDefault()}
																	>
																		<CheckCircle2 className="mr-2 size-4" />
																		Mark as Done
																	</DropdownMenuItem>
																</MarkInspectionDoneModal>

																<DeleteInspectionModal
																	inspectionId={inspection.id}
																>
																	<DropdownMenuItem
																		onSelect={(e) => e.preventDefault()}
																		className="text-destructive"
																	>
																		<CircleX className="mr-2 size-4 text-destructive" />
																		Cancel Inspection
																	</DropdownMenuItem>
																</DeleteInspectionModal>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												)}
										</div>
									</div>

									{inspection.description && (
										<p className="text-sm text-muted-foreground">
											{inspection.description}
										</p>
									)}

									<div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
										<div>
											<p className="text-muted-foreground">Scheduled Date</p>
											<p className="font-medium">
												{format(
													new Date(inspection.scheduledDate),
													"dd MMM yyyy",
												)}
											</p>
										</div>

										<div>
											<p className="text-muted-foreground">Completed Date</p>
											<p className="font-medium">
												{inspection.completedDate
													? format(
															new Date(inspection.completedDate),
															"dd MMM yyyy",
														)
													: "Not completed"}
											</p>
										</div>
									</div>
								</div>
							</div>

							{index < inspections.length - 1 && <Separator className="mt-4" />}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
