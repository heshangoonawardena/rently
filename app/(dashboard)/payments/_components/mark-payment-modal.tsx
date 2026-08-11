"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import type { ComponentType } from "react";
import * as React from "react";
import {
	type Control,
	Controller,
	type FieldErrors,
	type FieldPath,
	type FieldValues,
	useForm,
} from "react-hook-form";
import { toast } from "sonner";
import {
	type CreatePayment,
	createPayment,
} from "@/app/schemas/payment.schema";
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
	FieldDescription,
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
import {
	MANUAL_PAYMENT_TYPE_FILTER_OPTIONS,
	PAYMENT_METHOD_FILTER_OPTIONS,
} from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";
import { formatDateOnly } from "@/lib/utils";

const NO_PENDING_RENT_MONTH_RULE = "NO_PENDING_RENT_MONTH";

type Option = {
	value: string;
	label: string;
	icon?: ComponentType<{ className?: string }>;
};

function SelectField<TFieldValues extends FieldValues>({
	name,
	control,
	label,
	options,
}: {
	name: FieldPath<TFieldValues>;
	control: Control<TFieldValues>;
	label: string;
	options: readonly Option[];
}) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel>{label}</FieldLabel>

					<Select
						value={field.value == null ? "" : String(field.value)}
						onValueChange={field.onChange}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							{options.map((opt) => {
								const Icon = opt.icon;
								return (
									<SelectItem key={opt.value} value={opt.value}>
										<span className="flex items-center gap-2">
											{Icon && <Icon className="size-4" />}
											{opt.label}
										</span>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					<FieldError errors={[fieldState.error]} />
				</Field>
			)}
		/>
	);
}

export function MarkPaymentModal() {
	const [open, setOpen] = React.useState(false);
	const [datePopoverOpen, setDatePopoverOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<CreatePayment>({
		resolver: zodResolver(createPayment),
		defaultValues: {
			paymentType: "rent",
			paymentMethod: "cash",
			paymentDate: formatDateOnly(new Date()),
			paymentAmount: 0,
			periodStart: formatDateOnly(startOfMonth(new Date())),
			periodEnd: formatDateOnly(endOfMonth(new Date())),
			description: null,
		},
	});

	const {
		data: { items: leases },
	} = useSuspenseQuery(
		orpc.lease.list.queryOptions({
			input: {},
		}),
	);

	const activeLeases = React.useMemo(
		() =>
			leases.filter(
				(lease) => lease.status === "active" || lease.status === "extended",
			),
		[leases],
	);

	const selectedLeaseId = form.watch("leaseId");
	const selectedPaymentType = form.watch("paymentType");
	const selectedPaymentDate = form.watch("paymentDate");
	const isRentFlow =
		selectedPaymentType === "rent" || selectedPaymentType === "rent_waiver";
	const isDepositFlow =
		selectedPaymentType === "deposit" ||
		selectedPaymentType === "deposit_deduction";

	const paymentDate = React.useMemo(() => {
		const parsed = new Date(selectedPaymentDate);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}, [selectedPaymentDate]);

	const canResolveNextRentMonth = Boolean(
		selectedLeaseId && paymentDate && isRentFlow,
	);

	const nextRentMonthQuery = useQuery({
		...orpc.payment.nextRentMonth.queryOptions({
			input: {
				leaseId: selectedLeaseId ?? 0,
				paymentDate: paymentDate
					? format(paymentDate, "yyyy-MM-dd")
					: format(new Date(), "yyyy-MM-dd"),
			},
		}),
		enabled: canResolveNextRentMonth,
		retry: false,
	});

	const nextRentMonthErrorRule =
		(nextRentMonthQuery.error as { data?: { rule?: string } } | null)?.data
			?.rule ?? null;

	const hasNoPendingRentMonth =
		nextRentMonthErrorRule === NO_PENDING_RENT_MONTH_RULE;

	const isArrearsRecovery = React.useMemo(() => {
		if (!isRentFlow || !nextRentMonthQuery.data || !paymentDate) {
			return false;
		}

		return (
			startOfMonth(parseISO(nextRentMonthQuery.data.periodStart)).getTime() <
			startOfMonth(paymentDate).getTime()
		);
	}, [isRentFlow, nextRentMonthQuery.data, paymentDate]);

	React.useEffect(() => {
		if (isDepositFlow) {
			form.setValue("paymentAmount", 0);
			return;
		}

		if (isRentFlow && nextRentMonthQuery.data) {
			form.setValue("periodStart", nextRentMonthQuery.data.periodStart);
			form.setValue("periodEnd", nextRentMonthQuery.data.periodEnd);
			form.setValue(
				"paymentAmount",
				Number(nextRentMonthQuery.data.rentAmount),
			);
		}
	}, [isRentFlow, nextRentMonthQuery.data, form, isDepositFlow]);

	const createPaymentMutation = useMutation(
		orpc.payment.create.mutationOptions({
			onSuccess: () => {
				toast.success("Payment recorded successfully");

				queryClient.invalidateQueries({
					queryKey: orpc.payment.list.queryKey({
						input: {},
					}),
				});

				form.reset();
				setOpen(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	function onError(errors: FieldErrors<CreatePayment>) {
		console.log("Form errors:", errors);
	}

	function onSubmit(values: CreatePayment) {
		const selectedDate = new Date(values.paymentDate);
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (selectedDate.getTime() > today.getTime()) {
			toast.error("Payment date cannot be in the future");
			return;
		}

		if (values.paymentType === "rent" || values.paymentType === "rent_waiver") {
			if (!nextRentMonthQuery.data) {
				if (hasNoPendingRentMonth) {
					toast.error(
						"All rent months up to this payment date are already settled",
					);
				} else {
					toast.error("Unable to resolve the next due month for this lease");
				}
				return;
			}

			values.periodStart = nextRentMonthQuery.data.periodStart;
			values.periodEnd = nextRentMonthQuery.data.periodEnd;
		}

		if (isDepositFlow) {
			const monthStart = startOfMonth(selectedDate);
			values.periodStart = format(monthStart, "yyyy-MM-dd");
			values.periodEnd = format(endOfMonth(monthStart), "yyyy-MM-dd");
		}

		createPaymentMutation.mutate(values);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					Mark Payment
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Record Payment</DialogTitle>
					<DialogDescription>
						Record a payment made by a tenant.
					</DialogDescription>
				</DialogHeader>

				<form
					id="payment-form"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<Controller
							name="leaseId"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel>Lease *</FieldLabel>

									<Select
										value={field.value == null ? "" : String(field.value)}
										onValueChange={(v) => {
											const parsed = Number(v);
											if (!Number.isNaN(parsed)) field.onChange(parsed);
										}}
									>
										<SelectTrigger className="w-full h-auto min-h-14 py-2">
											<SelectValue placeholder="Select a Lease" />
										</SelectTrigger>

										<SelectContent>
											{activeLeases.map((lease) => (
												<SelectItem key={lease.id} value={lease.id.toString()}>
													<div className="flex flex-col gap-1">
														<span className="font-medium text-left">
															{lease.unit.name}
														</span>

														<span className="text-xs text-muted-foreground">
															{lease.tenant.firstName} {lease.tenant.lastName} •
															Rs.{" "}
															{lease.currentRent?.rentAmount.toLocaleString()} •
															Due day{" "}
															{lease.currentRent?.agreedPaymentDay ?? "-"}
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>

						<div className="grid md:grid-cols-2 gap-4">
							<SelectField
								name="paymentType"
								control={form.control}
								label="Payment Type"
								options={MANUAL_PAYMENT_TYPE_FILTER_OPTIONS}
							/>

							<SelectField
								name="paymentMethod"
								control={form.control}
								label="Method"
								options={PAYMENT_METHOD_FILTER_OPTIONS}
							/>
						</div>

						<div className="grid md:grid-cols-2 gap-4">
							{/* Payment Date */}
							<Controller
								name="paymentDate"
								control={form.control}
								render={({ field }) => (
									<Field>
										<FieldLabel>Date of Payment</FieldLabel>

										<Popover
											open={datePopoverOpen}
											onOpenChange={setDatePopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className="justify-start w-full"
												>
													<CalendarIcon className="mr-2 size-4" />

													{field.value
														? format(new Date(field.value), "yyyy-MM-dd")
														: "Pick a date"}
												</Button>
											</PopoverTrigger>

											<PopoverContent className="w-auto p-0">
												<Calendar
													mode="single"
													disabled={(date) => date.getTime() > Date.now()}
													onSelect={(date) => {
														if (!date) return;
														field.onChange(formatDateOnly(date));
														setDatePopoverOpen(false);
													}}
												/>
											</PopoverContent>
										</Popover>
									</Field>
								)}
							/>

							{/* Payment Amount */}
							<Controller
								name="paymentAmount"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Amount</FieldLabel>
										<Input
											type="number"
											value={field.value}
											disabled={!isDepositFlow}
											onChange={(e) => field.onChange(Number(e.target.value))}
										/>
										<FieldDescription>
											{isDepositFlow
												? selectedPaymentType === "deposit_deduction"
													? "Deposit deduction amount is editable and will reduce the lease deposit balance."
													: "Deposit amount is editable and will be added to the lease deposit balance."
												: "Amount is auto-filled from the lease rent for the next due month."}
										</FieldDescription>
										<FieldError errors={[fieldState.error]} />
									</Field>
								)}
							/>
						</div>

						<div className="grid md:grid-cols-2 gap-4">
							{/* Payment Period — read-only summary, not a real form field */}
							<Field>
								<FieldLabel>Payment Period</FieldLabel>

								<Input
									readOnly
									disabled
									value={
										isRentFlow
											? nextRentMonthQuery.data
												? `${format(parseISO(nextRentMonthQuery.data.periodStart), "yyyy-MMM-dd")} to ${format(parseISO(nextRentMonthQuery.data.periodEnd), "yyyy-MMM-dd")}`
												: nextRentMonthQuery.isFetching
													? "Resolving next due period..."
													: "No pending rent period"
											: "Not applicable for deposit payments"
									}
								/>

								<FieldDescription>
									{isRentFlow
										? isArrearsRecovery
											? "This will be recorded as arrears recovery."
											: hasNoPendingRentMonth
												? "All months up to the selected payment date are already settled."
												: "Period is auto-assigned to the next unpaid lease cycle."
										: "Deposit payments do not use rent month assignment."}
								</FieldDescription>
							</Field>
						</div>

						{/* Description */}
						<Controller
							name="description"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel>Description</FieldLabel>

									<Textarea
										rows={4}
										value={field.value ?? ""}
										onChange={(e) => field.onChange(e.target.value)}
									/>
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>
					</FieldGroup>
				</form>

				<DialogFooter>
					<Button variant="outline" onClick={() => form.reset()}>
						Reset
					</Button>

					<Button
						type="submit"
						form="payment-form"
						disabled={
							createPaymentMutation.isPending ||
							(isRentFlow && hasNoPendingRentMonth)
						}
					>
						{createPaymentMutation.isPending
							? "Recording..."
							: "Record Payment"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
