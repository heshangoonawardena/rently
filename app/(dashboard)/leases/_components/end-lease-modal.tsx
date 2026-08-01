"use client";

import * as React from "react";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { deleteLease, DeleteLease } from "@/app/schemas/lease.schema";
import { format } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateOnly } from "@/lib/utils";

type EndLeaseModalProps = {
	id: number;
	children?: React.ReactNode;
};

export function EndLeaseModal({ id, children }: EndLeaseModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<DeleteLease>({
		resolver: zodResolver(deleteLease),
		defaultValues: {
			id,
			endDate: formatDateOnly(new Date()),
		},
	});

	const endLeaseMutation = useMutation(
		orpc.lease.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Lease agreement deleted successfully");

				queryClient.invalidateQueries({
					queryKey: orpc.lease.list.queryKey({ input: {} }),
				});

				queryClient.invalidateQueries({
					queryKey: orpc.report.occupancySummary.queryKey(),
				});

				form.reset();
				setOpen(false);
			},
			onError: (e) => {
				toast.error(`${e.message}`);
			},
		}),
	);

	function onSubmit(values: DeleteLease) {
		console.log(values);

		endLeaseMutation.mutate(values);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="ghost">
						<Trash2 className="mr-2 size-4" />
						End Lease
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>End Lease Agreement</DialogTitle>

					<DialogDescription>
						This will terminate the lease by setting its end date.
					</DialogDescription>
				</DialogHeader>

				<form
					id="end-lease-form"
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid md:grid-cols-2 gap-4">
							<Controller
								name="endDate"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>End Date *</FieldLabel>

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
														format(field.value, "d MMM yyyy")
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
						</div>
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
							variant="destructive"
							form="end-lease-form"
							disabled={endLeaseMutation.isPending}
						>
							<Trash2 className="mr-2 size-4" />
							{endLeaseMutation.isPending ? "Ending..." : "End Lease"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
