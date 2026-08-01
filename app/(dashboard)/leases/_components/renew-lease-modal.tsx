"use client";

import * as React from "react";
import { CalendarIcon, RefreshCw } from "lucide-react";
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

import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import {
	ListLeaseOutput,
	RenewLease,
	renewLease,
} from "@/app/schemas/lease.schema";
import { format } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateOnly } from "@/lib/utils";

type RenewLeaseModalProps = {
	data: ListLeaseOutput["items"][number];
	triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
	children?: React.ReactNode;
};

export function RenewLeaseModal({
	data,
	triggerVariant = "ghost",
	children,
}: RenewLeaseModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<RenewLease>({
		resolver: zodResolver(renewLease),
		defaultValues: {
			id: data.id,
			newEndDate: data.endDate ? formatDateOnly(new Date(data.endDate)) : null,
			rentAmount: data.currentRent?.rentAmount,
			agreedPaymentDay: data.currentRent?.agreedPaymentDay ?? 1,
			effectiveDate: formatDateOnly(new Date()),
			depositAmount: data.depositAmount,
		},
	});

	const renewLeaseMutation = useMutation(
		orpc.lease.renew.mutationOptions({
			onSuccess: () => {
				toast.success("Lease agreement extended successfully");

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
				console.log(e);

				toast.error(`${e.message}`);
			},
		}),
	);

	function onSubmit(values: RenewLease) {
		console.log(values);

		renewLeaseMutation.mutate(values);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant={triggerVariant} className="w-full justify-start">
						<RefreshCw className="mr-2 size-4" />
						Renew lease
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Renew/ Extend Lease</DialogTitle>
					<DialogDescription>
						Renew or Extend lease agreement.
					</DialogDescription>
				</DialogHeader>

				<form
					id="renew-lease-form"
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid md:grid-cols-2 gap-4">
							{/* Start Date */}
							<Controller
								name="effectiveDate"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Effective From *</FieldLabel>

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

							{/* End Date */}
							<Controller
								name="newEndDate"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Ends On</FieldLabel>

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

						<div className="grid md:grid-cols-3 gap-4">
							{/* Rent */}
							<Controller
								name="rentAmount"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Monthly Rent *</FieldLabel>

										<Input
											type="number"
											value={field.value}
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>

										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* Deposit */}
							<Controller
								name="depositAmount"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Deposit *</FieldLabel>

										<Input
											type="number"
											value={field.value}
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>

										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* Agreed Payment Day */}
							<Controller
								name="agreedPaymentDay"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Monthly Due Day *</FieldLabel>

										<Input
											type="number"
											min={1}
											max={31}
											value={field.value}
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>

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
							form="renew-lease-form"
							disabled={renewLeaseMutation.isPending}
						>
							{renewLeaseMutation.isPending ? "Updating..." : "Renew Lease"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
