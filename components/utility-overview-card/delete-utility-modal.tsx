"use client";

import * as React from "react";
import { PowerOff } from "lucide-react";

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

type DeleteUtilityModalProps = {
	unitId: number;
	utilityId: number;
	utilityType: string;
	children?: React.ReactNode;
};

export function DeleteUtilityModal({
	unitId,
	utilityId,
	utilityType,
	children,
}: DeleteUtilityModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation(
		orpc.utility.deactivate.mutationOptions({
			onSuccess: () => {
				toast.success(`${utilityType} account deleted successfully`);

				queryClient.invalidateQueries({
					queryKey: orpc.utility.list.queryKey({ input: { unitId } }),
				});

				setOpen(false);
			},
			onError: (e) => {
				toast.error(e.message);
			},
		}),
	);

	function handleDelete() {
		deleteMutation.mutate({ unitId, id: utilityId });
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button variant="destructive" size="sm">
						<PowerOff className="mr-2 size-4" />
						Delete
					</Button>
				)}
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Utility Account?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete the{" "}
						<strong> {utilityType} account? </strong> This will mark it
						inactive.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteMutation.isPending}
					>
						<PowerOff className="mr-2 size-4" />
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
