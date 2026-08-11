"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type CreateTenantOccupant,
	createTenantOccupant,
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

type AddOccupantModalProps = {
	tenantId: number;
	children?: React.ReactNode;
};

export function AddOccupantModal({
	tenantId,
	children,
}: AddOccupantModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<CreateTenantOccupant>({
		resolver: zodResolver(createTenantOccupant),
		defaultValues: {
			tenantId: Number(tenantId),
			firstName: "",
			lastName: "",
			nic: null,
			relationship: "",
			phone: null,
		},
	});

	const createOccupantMutation = useMutation(
		orpc.tenant.createOccupant.mutationOptions({
			onSuccess: (newOccupant) => {
				toast.success(
					`${newOccupant.firstName} ${newOccupant.lastName ?? ""}`.trim() +
						" added successfully",
				);

				queryClient.invalidateQueries({
					queryKey: orpc.tenant.listOccupants.queryKey({ input: { tenantId } }),
				});

				form.reset();
				setOpen(false);
			},
			onError: (e) => {
				toast.error(e.message);
			},
		}),
	);

	function onSubmit(values: CreateTenantOccupant) {
		createOccupantMutation.mutate(values);
	}

	function onError(errors: FieldErrors<CreateTenantOccupant>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm">
						<Plus className="mr-2 size-4" />
						Add Occupant
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Add Occupant</DialogTitle>
					<DialogDescription>
						Add a new occupant for this tenant.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-add-occupant"
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
							onClick={() => form.reset()}
						>
							Reset Form
						</Button>

						<Button
							type="submit"
							form="form-add-occupant"
							disabled={createOccupantMutation.isPending}
						>
							{createOccupantMutation.isPending ? "Adding..." : "Add Occupant"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
