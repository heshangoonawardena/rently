"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { UTILITY_TYPE_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";
import { createUtility, CreateUtility } from "@/app/schemas/utility.schema";

type AddUtilityModalProps = {
	unitId: number;
	children?: React.ReactNode;
};

export function AddUtilityModal({ unitId, children }: AddUtilityModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<CreateUtility>({
		resolver: zodResolver(createUtility),
		defaultValues: {
			unitId: Number(unitId),
			utilityType: "electricity",
			holderName: "",
			address: "",
			accountNumber: "",
			description: "",
		},
	});

	const createUtilityMutation = useMutation(
		orpc.utility.create.mutationOptions({
			onSuccess: (newUtility) => {
				toast.success(`${newUtility.utilityType} account added successfully`);

				queryClient.invalidateQueries({
					queryKey: orpc.utility.list.queryKey({ input: { unitId } }),
				});

				form.reset();
				setOpen(false);
			},
			onError: (e) => {
				toast.error(e.message);
			},
		}),
	);

	function onSubmit(values: CreateUtility) {
		console.log(values);

		createUtilityMutation.mutate(values);
	}

	function onError(errors: FieldErrors<CreateUtility>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm">
						<Plus className="mr-2 size-4" />
						Add Utility
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Add Utility Account</DialogTitle>
					<DialogDescription>
						Add a new utility account for this property.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-add-utility"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					autoComplete="off"
					className="space-y-6"
				>
					<FieldGroup>
						<div className="grid gap-4 md:grid-cols-2">
							<Controller
								name="utilityType"
								control={form.control}
								render={({ field, fieldState }) => {
									return (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel>Utility Type *</FieldLabel>
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
													<SelectValue placeholder="Select utility type" />
												</SelectTrigger>

												<SelectContent>
													{UTILITY_TYPE_FILTER_OPTIONS.map((option) => {
														const Icon = option.icon;
														return (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																<div className="flex items-center gap-2">
																	<Icon className={`size-4 ${option.color}`} />
																	<span>{option.label}</span>
																</div>
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</Field>
									);
								}}
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
								name="address"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Address *</FieldLabel>
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
							form="form-add-utility"
							disabled={createUtilityMutation.isPending}
						>
							{createUtilityMutation.isPending ? "Adding..." : "Add Utility"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
