"use client";

import * as React from "react";
import { CalendarIcon, Pencil } from "lucide-react";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfDay } from "date-fns";
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
	updateInspection,
	UpdateInspection,
} from "@/app/schemas/inspection.schema";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateOnly } from "@/lib/utils";

type EditInspectionModalProps = {
	inspection: {
		id: number;
		unitId: number;
		title: string;
		description?: string | null;
		scheduledDate: string | Date;
		status: string;
		completedDate?: string | Date | null;
	};
	children?: React.ReactNode;
};

export function EditInspectionModal({
	inspection,
	children,
}: EditInspectionModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();
	const earliestSelectableDate = addDays(startOfDay(new Date()), 1);

	const form = useForm<UpdateInspection>({
		resolver: zodResolver(updateInspection),
		defaultValues: {
			id: inspection.id,
			unitId: Number(inspection.unitId),
			title: inspection.title,
			description: inspection.description ?? "",
			scheduledDate: formatDateOnly(new Date(inspection.scheduledDate)),
			status: "rescheduled",
			completedDate: null,
		},
	});

	const updateInspectionMutation = useMutation(
		orpc.inspection.update.mutationOptions({
			onSuccess: () => {
				toast.success("Inspection updated successfully");

				queryClient.invalidateQueries({
					queryKey: orpc.inspection.list.queryKey({ input: {} }),
				});

				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function onSubmit(values: UpdateInspection) {
		updateInspectionMutation.mutate(values);
	}

	function onError(errors: FieldErrors<UpdateInspection>) {
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
					<DialogTitle>Edit Inspection</DialogTitle>
					<DialogDescription>
						Update the inspection details for this unit.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-edit-inspection"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					autoComplete="off"
					className="space-y-6"
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
										value={field.value ?? ""}
										aria-invalid={fieldState.invalid}
										placeholder="Routine monthly inspection"
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<Controller
							name="scheduledDate"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Scheduled Date *</FieldLabel>

									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className="justify-start text-left font-normal w-full"
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{field.value ? (
													format(new Date(field.value), "d MMM yyyy")
												) : (
													<span className="text-muted-foreground">
														Pick a date
													</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={
													field.value ? new Date(field.value) : undefined
												}
												disabled={{ before: earliestSelectableDate }}
												onSelect={(date) =>
													field.onChange(date ? formatDateOnly(date) : null)
												}
											/>
										</PopoverContent>
									</Popover>

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
									<FieldLabel>Description</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										placeholder="Optional inspection notes..."
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
							form="form-edit-inspection"
							disabled={updateInspectionMutation.isPending}
						>
							{updateInspectionMutation.isPending
								? "Updating..."
								: "Edit Inspection"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
