"use client";

import * as React from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";

import { orpc } from "@/lib/orpc";
import {
	approveUser,
	type ApproveUser,
	type ListUsersOutput,
} from "@/app/schemas/user.schema";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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

type UserRow = ListUsersOutput["items"][number];

type ApproveUserModalProps = {
	user: UserRow;
	children?: React.ReactNode;
};

export function ApproveUserModal({ user, children }: ApproveUserModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const {
		data: { items: availableTenants },
	} = useSuspenseQuery(orpc.user.listAvailableTenants.queryOptions({ input: {} }));

	const form = useForm<ApproveUser>({
		resolver: zodResolver(approveUser),
		defaultValues: {
			userId: user.id,
			role: "manager",
			tenantId: null,
		},
	});

	const watchedRole = form.watch("role");

	React.useEffect(() => {
		if (watchedRole !== "tenant") {
			form.setValue("tenantId", null, { shouldValidate: true });
		}
	}, [form, watchedRole]);

	const approveUserMutation = useMutation(
		orpc.user.approve.mutationOptions({
			onSuccess: (data) => {
				toast.success(`${data.name} approved as ${data.role}`);

				queryClient.invalidateQueries({
					queryKey: orpc.user.list.queryKey({ input: {} }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.user.listAvailableTenants.queryKey({ input: {} }),
				});

				form.reset({
					userId: user.id,
					role: "manager",
					tenantId: null,
				});
				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const onSubmit = (values: ApproveUser) => {
		approveUserMutation.mutate(values);
	};

	const tenantRequiredAndMissing =
		watchedRole === "tenant" && !form.getValues("tenantId");

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm">
						<ShieldCheck className="mr-2 size-4" />
						Approve
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Approve User Access</DialogTitle>
					<DialogDescription>
						Grant portal access for {user.name} ({user.email}).
					</DialogDescription>
				</DialogHeader>

				<form
					id="approve-user-form"
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
											</SelectContent>
										</Select>
										<FieldDescription>
											Tenant users must be linked to an existing tenant profile before approval.
										</FieldDescription>
										{availableTenants.length === 0 && (
											<FieldDescription className="text-destructive">
												No unlinked tenants are available. Create or free a tenant profile first.
											</FieldDescription>
										)}
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
						form="approve-user-form"
						disabled={approveUserMutation.isPending || tenantRequiredAndMissing}
					>
						<Check className="mr-2 size-4" />
						{approveUserMutation.isPending ? "Approving..." : "Approve User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
