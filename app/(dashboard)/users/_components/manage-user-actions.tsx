"use client";

import * as React from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, ShieldAlert, UserCog } from "lucide-react";
import { toast } from "sonner";

import { orpc } from "@/lib/orpc";
import {
	type ListUsersOutput,
	type UpdateUserRole,
	updateUserRole,
} from "@/app/schemas/user.schema";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

type UserRow = ListUsersOutput["items"][number];

type ManageUserActionsProps = {
	user: UserRow;
};

export function ManageUserActions({ user }: ManageUserActionsProps) {
	const [roleOpen, setRoleOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const {
		data: { items: availableTenants },
	} = useSuspenseQuery(orpc.user.listAvailableTenants.queryOptions({ input: {} }));

	const form = useForm<UpdateUserRole>({
		resolver: zodResolver(updateUserRole),
		defaultValues: {
			userId: user.id,
			role: user.role ?? "manager",
			tenantId: user.tenantId,
		},
	});

	React.useEffect(() => {
		if (!roleOpen) {
			form.reset({
				userId: user.id,
				role: user.role ?? "manager",
				tenantId: user.tenantId,
			});
		}
	}, [form, roleOpen, user.id, user.role, user.tenantId]);

	const watchedRole = form.watch("role");

	React.useEffect(() => {
		if (watchedRole !== "tenant") {
			form.setValue("tenantId", null, { shouldValidate: true });
		}
	}, [form, watchedRole]);

	const updateRoleMutation = useMutation(
		orpc.user.updateRole.mutationOptions({
			onSuccess: (data) => {
				toast.success(`${data.name} is now ${data.role}`);
				queryClient.invalidateQueries({
					queryKey: orpc.user.list.queryKey({ input: {} }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.user.listAvailableTenants.queryKey({ input: {} }),
				});
				setRoleOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const revokeAccessMutation = useMutation(
		orpc.user.revokeAccess.mutationOptions({
			onSuccess: (data) => {
				toast.success(`Access revoked for ${data.name}`);
				queryClient.invalidateQueries({
					queryKey: orpc.user.list.queryKey({ input: {} }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.user.listAvailableTenants.queryKey({ input: {} }),
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const onSubmit = (values: UpdateUserRole) => {
		updateRoleMutation.mutate(values);
	};

	const tenantRequiredAndMissing =
		watchedRole === "tenant" && !form.getValues("tenantId");

	return (
		<>
			<Dialog open={roleOpen} onOpenChange={setRoleOpen}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => setRoleOpen(true)}>
							<UserCog className="mr-2 size-4" />
							Change Role
						</DropdownMenuItem>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<DropdownMenuItem
									variant="destructive"
									onSelect={(event) => event.preventDefault()}
								>
									<ShieldAlert className="mr-2 size-4" />
									Revoke Access
								</DropdownMenuItem>
							</AlertDialogTrigger>
							<AlertDialogContent size="sm">
								<AlertDialogHeader>
									<AlertDialogTitle>Revoke User Access?</AlertDialogTitle>
									<AlertDialogDescription>
										{user.name} will immediately lose access to this organization.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={() => revokeAccessMutation.mutate({ userId: user.id })}
										disabled={revokeAccessMutation.isPending}
									>
										{revokeAccessMutation.isPending
											? "Revoking..."
											: "Revoke Access"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</DropdownMenuContent>
				</DropdownMenu>

				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Change User Role</DialogTitle>
						<DialogDescription>
							Update role and tenant assignment for {user.name}.
						</DialogDescription>
					</DialogHeader>

					<form
						id="update-user-role-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FieldGroup>
							<Controller
								name="role"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Role</FieldLabel>
										<Select
											value={field.value}
											onValueChange={(value) => field.onChange(value)}
										>
											<SelectTrigger aria-invalid={fieldState.invalid}>
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="owner">Owner</SelectItem>
												<SelectItem value="manager">Manager</SelectItem>
												<SelectItem value="tenant">Tenant</SelectItem>
											</SelectContent>
										</Select>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{watchedRole === "tenant" && (
								<Controller
									name="tenantId"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel>Assign Tenant</FieldLabel>
											<Select
												value={field.value ? String(field.value) : undefined}
												onValueChange={(value) => field.onChange(Number(value))}
											>
												<SelectTrigger aria-invalid={fieldState.invalid}>
													<SelectValue placeholder="Select a tenant" />
												</SelectTrigger>
												<SelectContent>
													{availableTenants.map((item) => (
														<SelectItem key={item.id} value={String(item.id)}>
															{item.firstName} {item.lastName ?? ""} ({item.nic})
														</SelectItem>
													))}
													{user.tenantId && user.tenantName && (
														<SelectItem value={String(user.tenantId)}>
															{user.tenantName} (current)
														</SelectItem>
													)}
												</SelectContent>
											</Select>
											<FieldDescription>
												Tenant role must be linked to a tenant profile.
											</FieldDescription>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							)}
						</FieldGroup>
					</form>

					<DialogFooter>
						<Button
							type="submit"
							form="update-user-role-form"
							disabled={updateRoleMutation.isPending || tenantRequiredAndMissing}
						>
							{updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
