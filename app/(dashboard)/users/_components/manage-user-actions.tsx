"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { MoreHorizontal, ShieldAlert, Trash2, UserCog } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type ListUsersOutput,
	type UpdateUserRole,
	updateUserRole,
} from "@/app/schemas/user.schema";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { orpc } from "@/lib/orpc";

type UserRow = ListUsersOutput["items"][number];

type ManageUserActionsProps = {
	user: UserRow;
};

export function ManageUserActions({ user }: ManageUserActionsProps) {
	const [roleOpen, setRoleOpen] = React.useState(false);
	const [confirmRoleOpen, setConfirmRoleOpen] = React.useState(false);
	const [pendingRoleChange, setPendingRoleChange] =
		React.useState<UpdateUserRole | null>(null);
	const queryClient = useQueryClient();
	const usersQueryKey = orpc.user.list.queryKey({ input: {} });
	const availableTenantsQueryKey = orpc.user.listAvailableTenants.queryKey({
		input: {},
	});

	const {
		data: { items: availableTenants },
	} = useSuspenseQuery(
		orpc.user.listAvailableTenants.queryOptions({ input: {} }),
	);

	const {
		data: { items: users },
	} = useSuspenseQuery(
		orpc.user.list.queryOptions({
			input: {},
		}),
	);

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
			setConfirmRoleOpen(false);
			setPendingRoleChange(null);
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
				queryClient.setQueryData<ListUsersOutput>(usersQueryKey, (current) => {
					if (!current) {
						return current;
					}

					return {
						items: current.items.map((item) =>
							item.id === data.id ? { ...item, ...data } : item,
						),
					};
				});
				void queryClient.invalidateQueries({ queryKey: usersQueryKey });
				void queryClient.invalidateQueries({
					queryKey: availableTenantsQueryKey,
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
				queryClient.setQueryData<ListUsersOutput>(usersQueryKey, (current) => {
					if (!current) {
						return current;
					}

					return {
						items: current.items.map((item) =>
							item.id === data.id ? { ...item, ...data } : item,
						),
					};
				});
				void queryClient.invalidateQueries({ queryKey: usersQueryKey });
				void queryClient.invalidateQueries({
					queryKey: availableTenantsQueryKey,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const deleteUserMutation = useMutation(
		orpc.user.delete.mutationOptions({
			onSuccess: (data) => {
				toast.success(`${data.name} was deleted from the system`);
				queryClient.setQueryData<ListUsersOutput>(usersQueryKey, (current) => {
					if (!current) {
						return current;
					}

					return {
						items: current.items.filter((item) => item.id !== data.id),
					};
				});
				void queryClient.invalidateQueries({ queryKey: usersQueryKey });
				void queryClient.invalidateQueries({
					queryKey: availableTenantsQueryKey,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const onSubmit = (values: UpdateUserRole) => {
		setPendingRoleChange(values);
		setConfirmRoleOpen(true);
	};

	const handleConfirmRoleChange = () => {
		if (!pendingRoleChange) {
			return;
		}

		updateRoleMutation.mutate(pendingRoleChange);
		setConfirmRoleOpen(false);
	};

	const tenantRequiredAndMissing =
		watchedRole === "tenant" && !form.getValues("tenantId");
	const ownerCount = users.filter(
		(item) => item.approvalStatus === "approved" && item.role === "owner",
	).length;
	const ownerLimitReached = watchedRole === "owner" && user.role !== "owner";
	const ownerSelectionDisabled = user.role !== "owner" && ownerCount >= 2;
	const roleChangeBlocked = ownerLimitReached && ownerSelectionDisabled;

	const selectedTenantLabel =
		availableTenants.find((item) => item.id === form.getValues("tenantId")) ??
		null;
	const tenantOptions = React.useMemo(() => {
		return Array.from(
			new Map(availableTenants.map((item) => [item.id, item])).values(),
		);
	}, [availableTenants]);
	const hasCurrentTenantInOptions =
		Boolean(user.tenantId) &&
		tenantOptions.some((item) => item.id === user.tenantId);

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
										{user.name} will immediately lose access to this
										organization.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel variant="outline">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={() =>
											revokeAccessMutation.mutate({ userId: user.id })
										}
										disabled={revokeAccessMutation.isPending}
									>
										{revokeAccessMutation.isPending
											? "Revoking..."
											: "Revoke Access"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<AlertDialog>
							{/* <AlertDialogTrigger asChild>
								<DropdownMenuItem
									variant="destructive"
									onSelect={(event) => event.preventDefault()}
								>
									<Trash2 className="mr-2 size-4" />
									Delete User
								</DropdownMenuItem>
							</AlertDialogTrigger> */}
							<AlertDialogContent size="sm">
								<AlertDialogHeader>
									<AlertDialogTitle>Delete User Account?</AlertDialogTitle>
									<AlertDialogDescription>
										This permanently deletes {user.name} from the system and
										removes all access.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel variant="outline">
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={() =>
											deleteUserMutation.mutate({ userId: user.id })
										}
										disabled={deleteUserMutation.isPending}
									>
										{deleteUserMutation.isPending
											? "Deleting..."
											: "Delete User"}
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
												<SelectItem
													value="owner"
													disabled={ownerSelectionDisabled}
												>
													Owner
												</SelectItem>
												<SelectItem value="manager">Manager</SelectItem>
												<SelectItem
													value="tenant"
													disabled={user.role === "owner"}
												>
													Tenant
												</SelectItem>
											</SelectContent>
										</Select>
										{ownerSelectionDisabled && (
											<FieldDescription className="text-destructive">
												Only 2 owners are allowed at a time.
											</FieldDescription>
										)}
										{user.role === "owner" && (
											<FieldDescription className="text-destructive">
												Owner role cannot be changed directly to tenant.
											</FieldDescription>
										)}
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
													{tenantOptions.map((item) => (
														<SelectItem key={item.id} value={String(item.id)}>
															{item.firstName} {item.lastName ?? ""} ({item.nic}
															)
														</SelectItem>
													))}
													{user.tenantId &&
														user.tenantName &&
														!hasCurrentTenantInOptions && (
															<SelectItem
																key={`current-${user.tenantId}`}
																value={String(user.tenantId)}
															>
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
							disabled={
								updateRoleMutation.isPending ||
								tenantRequiredAndMissing ||
								roleChangeBlocked
							}
						>
							{updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmRoleOpen} onOpenChange={setConfirmRoleOpen}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Role Change?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingRoleChange
								? `Set ${user.name} to ${pendingRoleChange.role}${
										pendingRoleChange.role === "tenant" && selectedTenantLabel
											? ` (${selectedTenantLabel.firstName} ${selectedTenantLabel.lastName ?? ""})`
											: ""
									}`
								: "Confirm this role change."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmRoleChange}
							disabled={updateRoleMutation.isPending}
						>
							{updateRoleMutation.isPending ? "Applying..." : "Confirm"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
