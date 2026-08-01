"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { orpc } from "@/lib/orpc";
import {
	ListUtilityOutput,
	updateUtility,
	UpdateUtility,
} from "@/app/schemas/utility.schema";

type EditUtilityModalProps = {
	data: ListUtilityOutput["items"][number];
	children?: React.ReactNode;
};

export function EditUtilityModal({ data, children }: EditUtilityModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<UpdateUtility>({
		resolver: zodResolver(updateUtility),
		defaultValues: {
			id: data.id,
			unitId: data.unitId,
			utilityType: data.utilityType,
			holderName: data.holderName,
			accountNumber: data.accountNumber,
			address: data.address,
			description: data.description ?? "",
		},
	});

	const updateUtilityMutation = useMutation(
		orpc.utility.update.mutationOptions({
			onSuccess: (updatedUtility) => {
				toast.success(
					`${updatedUtility.utilityType} account updated successfully`,
				);

				queryClient.invalidateQueries({
					queryKey: orpc.utility.list.queryKey({
						input: { unitId: data.unitId },
					}),
				});

				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function onSubmit(values: UpdateUtility) {
		console.log("Submitting form with values:", values);
		updateUtilityMutation.mutate(values);
	}

	function onError(errors: FieldErrors<UpdateUtility>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm" className="cursor-pointer">
						<Pencil className="mr-2 size-4" />
						Edit
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Utility Account</DialogTitle>
					<DialogDescription>
						Update the utility account details for this property.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-edit-utility"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					autoComplete="off"
					className="space-y-6"
				>
					<FieldGroup>
						<div className="grid gap-4 md:grid-cols-2">
							<Controller
								name="accountNumber"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Account Number *</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											aria-invalid={fieldState.invalid}
											placeholder="123456789"
										/>
										{fieldState.invalid && (
											<FieldError
												className="h-0.5 max-h-0.5"
												errors={[fieldState.error]}
											/>
										)}
									</Field>
								)}
							/>

							<Controller
								name="holderName"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Holder Name *</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											aria-invalid={fieldState.invalid}
											placeholder="John Doe"
										/>
										{fieldState.invalid && (
											<FieldError
												className="h-0.5 max-h-0.5"
												errors={[fieldState.error]}
											/>
										)}
									</Field>
								)}
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<Controller
								name="address"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Address</FieldLabel>
										<Textarea
											{...field}
											value={field.value ?? ""}
											aria-invalid={fieldState.invalid}
											placeholder="Enter the service address..."
										/>
										{fieldState.invalid && (
											<FieldError
												className="h-0.5 max-h-0.5"
												errors={[fieldState.error]}
											/>
										)}
									</Field>
								)}
							/>
						</div>

						<Controller
							name="description"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Description</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										placeholder="Optional notes..."
										onChange={field.onChange}
									/>
									{fieldState.invalid && (
										<FieldError
											className="h-0.5 max-h-0.5"
											errors={[fieldState.error]}
										/>
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
							form="form-edit-utility"
							disabled={updateUtilityMutation.isPending}
						>
							{updateUtilityMutation.isPending
								? "Updating..."
								: "Update Utility"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
