"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type ListRepairRequestOutput,
	type UpdateRepairRequest,
	updateRepairRequest,
} from "@/app/schemas/repair.request.schema";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REPAIR_PRIORITY_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";

type EditRepairRequestModalProps = {
	data: ListRepairRequestOutput["items"][number];
	children?: React.ReactNode;
};

export function EditRepairRequestModal({
	data,
	children,
}: EditRepairRequestModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<UpdateRepairRequest>({
		resolver: zodResolver(updateRepairRequest),
		defaultValues: {
			id: data.id,
			unitId: data.unitId,
			title: data.title,
			repairType: data.repairType,
			description: data?.description ?? "",
			priority: data.priority,
		},
	});

	const updateRepairRequestMutation = useMutation(
		orpc.repair.update.mutationOptions({
			onSuccess: () => {
				toast.success(`${data.title} updated successfully`);

				queryClient.invalidateQueries({
					queryKey: orpc.repair.list.queryKey({ input: {} }),
				});

				form.reset();
				setOpen(false);
			},
			onError: (e) => {
				toast.error(e.message);
			},
		}),
	);

	function onSubmit(values: UpdateRepairRequest) {
		updateRepairRequestMutation.mutate(values);
	}

	function onError(errors: FieldErrors<UpdateRepairRequest>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start ">
						<Plus className="size-4" />
						Edit Repair Request
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Edit Repair Request</DialogTitle>

					<DialogDescription>Update the repair request.</DialogDescription>
				</DialogHeader>

				<form
					id="form-edit-repair-request"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<Controller
							name="title"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Title *</FieldLabel>
									<Input
										{...field}
										aria-invalid={fieldState.invalid}
										placeholder="Broken faucet"
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<div className="grid md:grid-cols-2 gap-4">
							<Controller
								name="priority"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Priority *</FieldLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												aria-invalid={fieldState.invalid}
												className="w-full"
											>
												<SelectValue placeholder="Select priority" />
											</SelectTrigger>

											<SelectContent>
												{REPAIR_PRIORITY_FILTER_OPTIONS.map((option) => {
													const Icon = option.icon;
													return (
														<SelectItem key={option.value} value={option.value}>
															<div className="flex items-center gap-2">
																<Icon className={`size-4 ${option.color}`} />
																<span>{option.label}</span>
															</div>
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
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
										placeholder="Describe the issue in a few words..."
										onChange={field.onChange}
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
							form="form-edit-repair-request"
							disabled={updateRepairRequestMutation.isPending}
						>
							{updateRepairRequestMutation.isPending
								? "Updating..."
								: "Updating Request"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
