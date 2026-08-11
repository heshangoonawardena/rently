"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";

type DeleteInspectionModalProps = {
	inspectionId: number;
	children?: React.ReactNode;
};

export function DeleteInspectionModal({
	inspectionId,
	children,
}: DeleteInspectionModalProps) {
	const [_open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const deleteInspectionMutation = useMutation(
		orpc.inspection.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Inspection cancelled successfully");

				queryClient.invalidateQueries({
					queryKey: orpc.inspection.list.queryKey({ input: {} }),
				});

				queryClient.invalidateQueries({
					queryKey: orpc.report.upcomingInspections.queryKey({
						input: { daysAhead: 60 },
					}),
				});

				setOpen(false);
			},
			onError: (e) => {
				toast.error(`${e.message}`);
			},
		}),
	);

	function handleDelete() {
		deleteInspectionMutation.mutate({
			id: inspectionId,
		});
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start" variant="ghost" size="sm">
						<Trash2 className="mr-2 size-4" />
						Cancel Inspection
					</Button>
				)}
			</AlertDialogTrigger>

			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel Inspection?</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to cancel this inspection? This action cannot
						be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteInspectionMutation.isPending}
					>
						<Trash2 className="mr-2 size-4" />
						{deleteInspectionMutation.isPending ? "Cancelling..." : "Cancel"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
