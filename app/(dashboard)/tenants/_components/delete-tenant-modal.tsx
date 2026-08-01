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

type DeleteTenantModalProps = {
	tenantId: number;
	tenantName: string;
	children?: React.ReactNode;
};

export function DeleteTenantModal({
	tenantId,
	tenantName,
	children,
}: DeleteTenantModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const deleteTenantMutation = useMutation(
		orpc.tenant.delete.mutationOptions({
			onSuccess: (deletedTenant) => {
				toast.success(
					`Tenant ${deletedTenant.nickname ?? deletedTenant.firstName} deleted successfully`,
				);

				queryClient.invalidateQueries({
					queryKey: orpc.tenant.list.queryKey({ input: {} }),
				});

				setOpen(false);
			},
			onError: (e) => {
				toast.error(`${e.message}`);
			},
		}),
	);

	function handleDelete() {
		deleteTenantMutation.mutate({
			id: tenantId,
		});
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start" variant="ghost" size="sm">
						<Trash2 className="mr-2 size-4" />
						Delete Tenant
					</Button>
				)}
			</AlertDialogTrigger>

			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Tenant?</AlertDialogTitle>

					<AlertDialogDescription>
						Are you sure you want to delete
						<span className="text-foreground"> {tenantName}</span>? This action
						cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteTenantMutation.isPending}
					>
						<Trash2 className="mr-2 size-4" />
						{deleteTenantMutation.isPending ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
