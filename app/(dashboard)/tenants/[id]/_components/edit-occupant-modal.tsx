"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import * as React from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type ListTenantOccupantOutput,
	type UpdateTenantOccupant,
	updateTenantOccupant,
} from "@/app/schemas/tenant.occupant.schema";
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
import { orpc } from "@/lib/orpc";

type EditOccupantModalProps = {
	tenantId: number;
	occupant: ListTenantOccupantOutput["items"][number];
	children?: React.ReactNode;
};

export function EditOccupantModal({
	tenantId,
	occupant,
	children,
}: EditOccupantModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<UpdateTenantOccupant>({
		resolver: zodResolver(updateTenantOccupant),
		defaultValues: {
			id: occupant.id,
			tenantId,
			firstName: occupant.firstName,
			lastName: occupant.lastName ?? "",
			nic: occupant.nic ?? "",
			relationship: occupant.relationship,
			phone: occupant.phone ?? "",
		},
	});

	React.useEffect(() => {
		if (!open) {
			form.reset({
				id: occupant.id,
				tenantId,
				firstName: occupant.firstName,
				lastName: occupant.lastName ?? "",
				nic: occupant.nic ?? "",
				relationship: occupant.relationship,
				phone: occupant.phone ?? "",
			});
		}
	}, [open, occupant, tenantId, form]);

	const updateOccupantMutation = useMutation(
		orpc.tenant.updateOccupant.mutationOptions({
			onSuccess: (updatedOccupant) => {
				toast.success(
					`${updatedOccupant.firstName} ${updatedOccupant.lastName ?? ""}`.trim() +
						" updated successfully",
				);

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

	function onSubmit(values: UpdateTenantOccupant) {
		updateOccupantMutation.mutate(values);
	}

	function onError(errors: FieldErrors<UpdateTenantOccupant>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm">
						<Edit className="mr-2 size-4" />
						Edit Occupant
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Edit Occupant</DialogTitle>
					<DialogDescription>
						Update occupant details for this tenant.
					</DialogDescription>
				</DialogHeader>

				<form
					id={`form-edit-occupant-${occupant.id}`}
					onSubmit={form.handleSubmit(onSubmit, onError)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid gap-4 md:grid-cols-2">
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
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<Controller
								name="relationship"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Relationship *</FieldLabel>
										<Input
											{...field}
											placeholder="Spouse"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="nic"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>NIC</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											placeholder="200012345678"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>

						<Controller
							name="phone"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Phone</FieldLabel>
									<Input
										{...field}
										value={field.value ?? ""}
										placeholder="077 123 4567"
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
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								form.reset({
									id: occupant.id,
									tenantId,
									firstName: occupant.firstName,
									lastName: occupant.lastName ?? "",
									nic: occupant.nic ?? "",
									relationship: occupant.relationship,
									phone: occupant.phone ?? "",
								})
							}
						>
							Reset Form
						</Button>

						<Button
							type="submit"
							form={`form-edit-occupant-${occupant.id}`}
							disabled={updateOccupantMutation.isPending}
						>
							<Edit className="mr-2 size-4" />
							{updateOccupantMutation.isPending
								? "Updating..."
								: "Update Occupant"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
