"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
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

type DeleteOccupantButtonProps = {
	tenantId: number;
	occupantId: number;
	occupantName: string;
	children?: React.ReactNode;
};

export function DeleteOccupantButton({
	tenantId,
	occupantId,
	occupantName,
	children
}: DeleteOccupantButtonProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const deleteOccupantMutation = useMutation(
		orpc.tenant.deleteOccupant.mutationOptions({
			onSuccess: () => {
				toast.success(`${occupantName} removed successfully`);

				queryClient.invalidateQueries({
					queryKey: orpc.tenant.listOccupants.queryKey({ input: { tenantId } }),
				});

				setOpen(false);
			},
			onError: (e) => {
				toast.error(e.message);
			},
		}),
	);

	function handleDelete() {
		deleteOccupantMutation.mutate({ tenantId, id: occupantId });
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button variant="destructive" size="sm">
						<Trash2 className="mr-2 size-4" />
						Delete
					</Button>
				)}
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Occupant?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to remove <strong>{occupantName}</strong>?
						This will mark the occupant as inactive.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteOccupantMutation.isPending}
					>
						<Trash2 className="mr-2 size-4" />
						{deleteOccupantMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
