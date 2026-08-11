"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type ListTenantOutput,
	type UpdateTenant,
	updateTenant,
} from "@/app/schemas/tenant.schema";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/lib/orpc";

type EditTenantModalProps = {
	data: ListTenantOutput["items"][number];
	children?: React.ReactNode;
};

export function EditTenantModal({ data, children }: EditTenantModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<UpdateTenant>({
		resolver: zodResolver(updateTenant),
		defaultValues: {
			id: data.id,
			firstName: data.firstName,
			lastName: data.lastName ?? "",
			nickname: data.nickname ?? "",
			address: data.address ?? "",
			nic: data.nic,
			phoneNumber: data.phoneNumber,
			occupation: data.occupation ?? "",
			status: data.status,
		},
	});

	const updateTenantMutation = useMutation(
		orpc.tenant.update.mutationOptions({
			onSuccess: () => {
				toast.success(
					`Tenant ${data.firstName} ${data?.lastName} updated successfully`,
				);

				queryClient.invalidateQueries({
					queryKey: orpc.tenant.list.queryKey({ input: {} }),
				});

				form.reset();
				setOpen(false);
			},
			onError: (e) => {
				toast.error(`${e.message}`);
			},
		}),
	);

	function onSubmit(values: UpdateTenant) {
		updateTenantMutation.mutate(values);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start">
						<Edit className="mr-2 size-4" />
						Edit Tenant
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Edit Tenant</DialogTitle>

					<DialogDescription>
						Update the tenant's personal and contact information.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-edit-tenant"
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid md:grid-cols-2 gap-4">
							{/* First Name */}
							<Controller
								name="firstName"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>First Name *</FieldLabel>
										<Input
											{...field}
											placeholder="John"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* Last Name */}
							<Controller
								name="lastName"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Last Name</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="Doe"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* Nickname */}
							<Controller
								name="nickname"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Nickname</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="Johnny"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* NIC */}
							<Controller
								name="nic"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>NIC *</FieldLabel>
										<Input
											{...field}
											placeholder="200012345678"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* Phone Number */}
							<Controller
								name="phoneNumber"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Phone Number *</FieldLabel>
										<Input
											{...field}
											type="tel"
											placeholder="077 123 4567"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="occupation"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Occupation</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="Teacher"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>

						{/* Address */}
						<Controller
							name="address"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Address</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										placeholder="Enter full address..."
										aria-invalid={fieldState.invalid}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
				<DialogFooter>
					{/* ACTIONS */}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => form.reset()}
						>
							Reset Form
						</Button>

						<Button
							type="submit"
							form="form-edit-tenant"
							disabled={updateTenantMutation.isPending}
						>
							<Edit className="mr-2 size-4" />
							{updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
