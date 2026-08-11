"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfDay } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import * as React from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type CreateInspection,
	createInspection,
} from "@/app/schemas/inspection.schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/lib/orpc";
import { formatDateOnly } from "@/lib/utils";

type AddInspectionModalProps = {
	unitId?: number;
	children?: React.ReactNode;
};

export function AddInspectionModal({
	unitId,
	children,
}: AddInspectionModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const { data } = useQuery({
		...orpc.unit.list.queryOptions({ input: {} }),
		enabled: !unitId,
	});

	const units = data?.items ?? [];

	const form = useForm<CreateInspection>({
		resolver: zodResolver(createInspection),
		defaultValues: {
			unitId: unitId ?? 0,
			title: "",
			description: "",
			scheduledDate: formatDateOnly(addDays(startOfDay(new Date()), 1)),
		},
	});
	const earliestSelectableDate = addDays(startOfDay(new Date()), 1);

	const createInspectionMutation = useMutation(
		orpc.inspection.create.mutationOptions({
			onSuccess: () => {
				toast.success("Inspection scheduled successfully");

				if (unitId) {
					queryClient.invalidateQueries({
						queryKey: orpc.inspection.list.queryKey({
							input: { unitId },
						}),
					});
				} else {
					queryClient.invalidateQueries({
						queryKey: orpc.inspection.list.queryKey({
							input: {},
						}),
					});
				}
				form.reset();
				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function onSubmit(values: CreateInspection) {
		createInspectionMutation.mutate(values);
	}

	function onError(errors: FieldErrors<CreateInspection>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm">
						<Plus className="mr-2 size-4" />
						Schedule Inspection
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Schedule Inspection</DialogTitle>
					<DialogDescription>
						Create a new inspection record for this unit.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-add-inspection"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					autoComplete="off"
					className="space-y-6"
				>
					<FieldGroup>
						{!unitId && (
							<Controller
								name="unitId"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Unit *</FieldLabel>

										<Select
											value={field.value ? field.value.toString() : undefined}
											onValueChange={(value) => field.onChange(Number(value))}
										>
											<SelectTrigger aria-invalid={fieldState.invalid}>
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>

											<SelectContent>
												{units.map((unit) => (
													<SelectItem key={unit.id} value={unit.id.toString()}>
														{unit.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						)}

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
												variant={"outline"}
												className="justify-start text-left font-normal w-full"
												id="date-0"
												name=""
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
							form="form-add-inspection"
							disabled={createInspectionMutation.isPending}
						>
							{createInspectionMutation.isPending
								? "Scheduling..."
								: "Schedule Inspection"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
