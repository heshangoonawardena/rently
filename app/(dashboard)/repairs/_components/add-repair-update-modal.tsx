"use client";

import * as React from "react";
import { MessageSquarePlus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FieldErrors, useForm } from "react-hook-form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { orpc } from "@/lib/orpc";
import {
	createRepairUpdate,
	CreateRepairUpdate,
} from "@/app/schemas/repair.update.schema";
import { repairStatusEnum } from "@/db/schema/enums";
import { UPDATE_REPAIR_STATUS_FILTER_OPTIONS } from "@/config/table-facet-meta";

type AddRepairUpdateModalProps = {
	repairRequestId: number;
	currentStatus: (typeof repairStatusEnum.enumValues)[number];
	children?: React.ReactNode;
};

export default function AddRepairUpdateModal({
	repairRequestId,
	currentStatus,
	children,
}: AddRepairUpdateModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<CreateRepairUpdate>({
		resolver: zodResolver(createRepairUpdate),
		defaultValues: {
			repairRequestId,
			newStatus: "in_progress",
			description: "",
		},
	});

	const addRepairUpdateMutation = useMutation(
		orpc.repair.addUpdate.mutationOptions({
			onSuccess: () => {
				toast.success("Repair update added successfully");

				queryClient.invalidateQueries({
					queryKey: orpc.repair.listUpdates.queryKey({
						input: { repairRequestId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.repair.list.queryKey({ input: {} }),
				});

				form.reset();
				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function onSubmit(values: CreateRepairUpdate) {
		const payload = {
			...values,
			description:
				values.description && values.description.trim().length > 0
					? values.description.trim()
					: null,
			newStatus: values.newStatus ?? null,
		};

		addRepairUpdateMutation.mutate(payload);
	}

	function onError(errors: FieldErrors<CreateRepairUpdate>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) {
					form.reset();
				}
			}}
		>
			<DialogTrigger asChild>
				{children ?? (
					<Button className="w-full justify-start cursor-pointer">
						<MessageSquarePlus className="mr-2 size-4" />
						Add Update
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Add Repair Update</DialogTitle>
					<DialogDescription>
						Log a progress note and optionally move this request to a new
						status.
					</DialogDescription>
				</DialogHeader>

				<form
					id={`form-add-repair-update-${repairRequestId}`}
					onSubmit={form.handleSubmit(onSubmit, onError)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<Controller
							name="newStatus"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Status</FieldLabel>
									<Select
										value={field.value ?? currentStatus}
										onValueChange={(value) => field.onChange(value)}
									>
										<SelectTrigger
											aria-invalid={fieldState.invalid}
											className="w-full"
										>
											<SelectValue placeholder="Select status" />
										</SelectTrigger>

										<SelectContent>
											{UPDATE_REPAIR_STATUS_FILTER_OPTIONS.filter(
												(option) => option.value !== "open",
											).map((option) => {
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

						<Controller
							name="description"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Update Note</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										placeholder="Started inspection, parts ordered, technician assigned..."
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
							form={`form-add-repair-update-${repairRequestId}`}
							disabled={addRepairUpdateMutation.isPending}
						>
							{addRepairUpdateMutation.isPending ? "Adding..." : "Add Update"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
