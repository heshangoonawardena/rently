"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Edit, MoreHorizontal, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { repairStatusEnum } from "@/db/schema/enums";
import { orpc } from "@/lib/orpc";
import type { Role } from "@/types/role";
import AddRepairUpdateModal from "./add-repair-update-modal";

export type RepairUpdatesTableProps = {
	repairRequestId: number;
	currentStatus: (typeof repairStatusEnum.enumValues)[number];
	role: Role;
};

export default function RepairUpdatesTable({
	repairRequestId,
	currentStatus,
	role,
}: RepairUpdatesTableProps) {
	const { data: { items: updates } = { items: [] } } = useSuspenseQuery(
		orpc.repair.listUpdates.queryOptions({ input: { repairRequestId } }),
	);

	const canManageLease =
		role !== "tenant" &&
		(updates.length === 0 ||
			["in_progress", "open"].includes(updates[0]?.newStatus));
	const canAddUpdate =
		canManageLease && !["resolved", "cancelled"].includes(currentStatus);

	return (
		<div className="space-y-2 p-2 max-w-screen">
			{canAddUpdate && (
				<div className="flex justify-end pb-1">
					<AddRepairUpdateModal
						repairRequestId={repairRequestId}
						currentStatus={currentStatus}
					/>
				</div>
			)}
			{(!updates || updates.length === 0) && (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
					<Wrench className="mb-3 size-8 text-muted-foreground" />
					<p className="font-medium">No repair updates</p>
					<p className="mt-1 max-w-xs text-sm text-muted-foreground">
						This repair request has no updates yet..
					</p>
				</div>
			)}

			{updates.map((update) => {
				const createdAtMs = new Date(update.createdAt).getTime();
				const isEditLocked =
					role === "tenant" &&
					Number.isFinite(createdAtMs) &&
					Date.now() - createdAtMs > 10 * 60 * 1000;
				const canEdit =
					canManageLease &&
					!isEditLocked &&
					!["resolved", "cancelled"].includes(update.newStatus ?? "");

				return (
					<Card key={update.id} className="p-0">
						<CardContent className="p-4">
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
										{(update.updaterName || "?")
											.split(" ")
											.map((n) => n[0])
											.slice(0, 2)
											.join("")}
									</div>
									<div className="text-sm">
										<div className="font-medium">
											{update.description ?? "No comments"}
										</div>
										<div className="text-xs text-muted-foreground">
											by {update.updaterName ?? "Unknown"}
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											{new Date(update.createdAt).toLocaleString()}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="text-xs text-muted-foreground">
										{update.oldStatus
											? `${update.oldStatus.replaceAll("_", " ")} → `
											: ""}
										{update.newStatus
											? update.newStatus.replaceAll("_", " ")
											: ""}
									</div>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="size-8 p-0">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>

										<DropdownMenuContent align="end">
											{/* implement repair update edit */}
											{canEdit ? (
												<DropdownMenuItem>
													<Edit className="mr-2 size-4" />
													Edit Update
												</DropdownMenuItem>
											) : (
												<DropdownMenuItem disabled>
													<Edit className="mr-2 size-4" />
													Edit Update
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
