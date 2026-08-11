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

type DeleteUnitModalProps = {
	unitId: number;
	unitName: string;
	children?: React.ReactNode;
};

export function DeleteUnitModal({
	unitId,
	unitName,
	children,
}: DeleteUnitModalProps) {
	const [_open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const deleteUnitMutation = useMutation(
		orpc.unit.delete.mutationOptions({
			onSuccess: (deletedUnit) => {
				toast.success(`${deletedUnit.name} deleted successfully`);

				queryClient.invalidateQueries({
					queryKey: orpc.unit.list.queryKey({ input: {} }),
				});

				queryClient.invalidateQueries({
					queryKey: orpc.report.occupancySummary.queryKey(),
				});

				setOpen(false);
			},
			onError: (e) => {
				toast.error(`${e.message}`);
			},
		}),
	);

	function handleDelete() {
		deleteUnitMutation.mutate({
			id: unitId,
		});
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start" variant="ghost" size="sm">
						<Trash2 className="mr-2 size-4" />
						Delete Unit
					</Button>
				)}
			</AlertDialogTrigger>

			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Unit?</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to delete
						<span className="text-foreground"> {unitName}</span>? This action
						cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteUnitMutation.isPending}
					>
						<Trash2 className="mr-2 size-4" />
						{deleteUnitMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
