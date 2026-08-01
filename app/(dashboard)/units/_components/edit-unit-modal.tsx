"use client";

import * as React from "react";
import { Edit } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ListUnitOutput,
	updateUnit,
	UpdateUnit,
} from "@/app/schemas/unit.schema";
import { utilityBillingModeEnum } from "@/db/schema/enums";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { UNIT_TYPE_FILTER_OPTIONS } from "@/config/table-facet-meta";

type EditUnitModalProps = {
	data: ListUnitOutput["items"][number];
	triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
	children?: React.ReactNode;
};

export function EditUnitModal({
	data,
	triggerVariant = "ghost",
	children,
}: EditUnitModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<UpdateUnit>({
		resolver: zodResolver(updateUnit),
		defaultValues: {
			id: data.id,
			name: data.name,
			type: data.type,
			address: data.address,
			description: data?.description ?? "",
			utilityBillingMode: data.utilityBillingMode,
			status: data.status,
		},
	});

	const updateUnitMutation = useMutation(
		orpc.unit.update.mutationOptions({
			onSuccess: () => {
				toast.success(`${data.name} updated successfully`);

				queryClient.invalidateQueries({
					queryKey: orpc.unit.list.queryKey({ input: {} }),
				});

				queryClient.invalidateQueries({
					queryKey: orpc.report.occupancySummary.queryKey(),
				});

				setOpen(false);
			},
			onError: (e) => {
				toast.error(e.message);
			},
		}),
	);

	function onSubmit(values: UpdateUnit) {
		updateUnitMutation.mutate(values);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button
						className="w-full justify-start cursor-pointer"
						variant={triggerVariant}
					>
						<Edit className="mr-2 size-4" />
						Edit Unit
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Edit Unit</DialogTitle>

					<DialogDescription>
						Update the property's information.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-edit-unit"
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid md:grid-cols-3 gap-4">
							<Controller
								name="name"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Unit Name *</FieldLabel>
										<Input
											{...field}
											aria-invalid={fieldState.invalid}
											placeholder="Unit A"
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
								name="type"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Type</FieldLabel>
										{fieldState.invalid && (
											<FieldError
												className="h-0.5 max-h-0.5"
												errors={[fieldState.error]}
											/>
										)}

										<Select
											name={field.name}
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger
												aria-invalid={fieldState.invalid}
												className="w-full"
											>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>

											<SelectContent>
												{UNIT_TYPE_FILTER_OPTIONS.map((option) => {
													const Icon = option.icon;

													return (
														<SelectItem key={option.value} value={option.value}>
															<div className="flex items-center gap-2">
																<Icon className="size-4" />
																<span>{option.label}</span>
															</div>
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
									</Field>
								)}
							/>

							<Controller
								name="utilityBillingMode"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Utility Billing</FieldLabel>
										{fieldState.invalid && (
											<FieldError
												className="h-0.5 max-h-0.5"
												errors={[fieldState.error]}
											/>
										)}
										<Select
											name={field.name}
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger
												aria-invalid={fieldState.invalid}
												className="w-full"
											>
												<SelectValue placeholder="Select billing mode" />
											</SelectTrigger>

											<SelectContent>
												{utilityBillingModeEnum.enumValues.map((value) => (
													<SelectItem key={value} value={value}>
														{value.replace("_", " ")}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
						</div>

						{/* ADDRESS */}
						<Controller
							name="address"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Address *</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										aria-invalid={fieldState.invalid}
										placeholder="Enter full address..."
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

						{/* DESCRIPTION */}
						<Controller
							name="description"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Description</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										placeholder="Optional details..."
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
							form="form-edit-unit"
							disabled={updateUnitMutation.isPending}
						>
							{updateUnitMutation.isPending ? "Updating..." : "Update Unit"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
