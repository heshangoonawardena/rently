"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import * as React from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type CompleteInspection,
	completeInspection,
} from "@/app/schemas/inspection.schema";
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
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/lib/orpc";
import { formatDateOnly } from "@/lib/utils";

type MarkInspectionDoneModalProps = {
	inspection: {
		id: number;
		description?: string | null;
	};
	children?: React.ReactNode;
};

export function MarkInspectionDoneModal({
	inspection,
	children,
}: MarkInspectionDoneModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<CompleteInspection>({
		resolver: zodResolver(completeInspection),
		defaultValues: {
			id: inspection.id,
			description: inspection.description ?? "",
			completedDate: formatDateOnly(new Date()),
		},
	});

	const completeInspectionMutation = useMutation(
		orpc.inspection.complete.mutationOptions({
			onSuccess: () => {
				toast.success("Inspection marked as done");

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

	function onSubmit(values: CompleteInspection) {
		completeInspectionMutation.mutate(values);
	}

	function onError(errors: FieldErrors<CompleteInspection>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline" size="sm">
						<CheckCircle2 className="mr-2 size-4" />
						Mark as Done
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Mark Inspection as Done</DialogTitle>
					<DialogDescription>
						The completed date is set automatically to the current date.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-mark-inspection-done"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					autoComplete="off"
					className="space-y-6"
				>
					<FieldGroup>
						{/* description */}
						<Controller
							name="description"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Comments</FieldLabel>
									<Textarea
										{...field}
										value={field.value ?? ""}
										placeholder="Add completion comments..."
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
							form="form-mark-inspection-done"
							disabled={completeInspectionMutation.isPending}
						>
							{completeInspectionMutation.isPending
								? "Updating..."
								: "Mark as Done"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
