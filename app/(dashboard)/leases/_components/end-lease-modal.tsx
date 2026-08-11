"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type DeleteLease, deleteLease } from "@/app/schemas/lease.schema";
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
import { LEASE_SETTLEMENT_EXPENSE_CATEGORY_FILTER_OPTIONS } from "@/config/table-facet-meta";
import { orpc } from "@/lib/orpc";
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
			expenses: [],
			notes: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "expenses",
	});

	const { data: lease } = useQuery({
		...orpc.lease.get.queryOptions({ input: { id } }),
		enabled: open,
	});

	const watchedExpenses = form.watch("expenses") ?? [];
	const totalDeductions = watchedExpenses.reduce(
		(sum, expense) =>
			sum + (Number.isFinite(expense?.amount) ? expense.amount : 0),
		0,
	);
	const depositAtTermination = Number(lease?.depositAmount ?? 0);
	const refundableAmount = Math.max(depositAtTermination - totalDeductions, 0);
	const outstandingAmount = Math.max(totalDeductions - depositAtTermination, 0);

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

			<DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>End Lease Agreement</DialogTitle>

					<DialogDescription>
						Add arrears and other deductions to calculate the final deposit
						settlement.
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
													<CalendarIcon className="mr-2 size-4" />
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

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<FieldLabel>Settlement Deductions</FieldLabel>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											label: "",
											category: "damage_charge",
											amount: 0,
											notes: "",
										})
									}
								>
									<Plus className="mr-2 size-4" />
									Add Expense
								</Button>
							</div>

							{fields.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No deductions added. Full deposit will be returned.
								</p>
							)}

							<div className="space-y-3">
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="rounded-md border p-3 space-y-3"
									>
										<div className="grid md:grid-cols-3 gap-3">
											<Field>
												<FieldLabel>Label *</FieldLabel>
												<Input
													placeholder="Utility arrears / Repair charge"
													{...form.register(`expenses.${index}.label`)}
												/>
												{form.formState.errors.expenses?.[index]?.label && (
													<FieldError
														errors={[
															form.formState.errors.expenses[index].label,
														]}
													/>
												)}
											</Field>

											<Controller
												name={`expenses.${index}.category`}
												control={form.control}
												render={({ field, fieldState }) => (
													<Field data-invalid={fieldState.invalid}>
														<FieldLabel>Category</FieldLabel>
														<Select
															value={field.value ?? undefined}
															onValueChange={field.onChange}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select category" />
															</SelectTrigger>

															<SelectContent>
																{LEASE_SETTLEMENT_EXPENSE_CATEGORY_FILTER_OPTIONS.map(
																	(option) => {
																		const Icon = option.icon;
																		return (
																			<SelectItem
																				key={option.value}
																				value={option.value}
																			>
																				<div className="flex items-center gap-2">
																					<Icon
																						className={`size-4 ${option.color}`}
																					/>
																					<span>{option.label}</span>
																				</div>
																			</SelectItem>
																		);
																	},
																)}
															</SelectContent>
														</Select>
														{fieldState.invalid && (
															<FieldError errors={[fieldState.error]} />
														)}
													</Field>
												)}
											/>

											<Field>
												<FieldLabel>Amount *</FieldLabel>
												<Input
													type="number"
													step="0.01"
													min="0"
													{...form.register(`expenses.${index}.amount`, {
														valueAsNumber: true,
													})}
												/>
												{form.formState.errors.expenses?.[index]?.amount && (
													<FieldError
														errors={[
															form.formState.errors.expenses[index].amount,
														]}
													/>
												)}
											</Field>
										</div>

										<Field>
											<FieldLabel>Notes</FieldLabel>
											<Textarea
												rows={2}
												placeholder="Optional details"
												{...form.register(`expenses.${index}.notes`)}
											/>
										</Field>

										<div className="flex justify-end">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => remove(index)}
											>
												<Trash2 className="mr-2 size-4" />
												Remove
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>

						<Field>
							<FieldLabel>Settlement Notes</FieldLabel>
							<Textarea
								rows={3}
								placeholder="Optional summary for this settlement"
								{...form.register("notes")}
							/>
						</Field>

						<div className="rounded-md border p-3 grid grid-cols-2 gap-3 text-sm">
							<div>
								<p className="text-muted-foreground">Deposit at termination</p>
								<p className="font-semibold">
									LKR {depositAtTermination.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Total deductions</p>
								<p className="font-semibold text-chart-1">
									LKR {totalDeductions.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Refund to tenant</p>
								<p className="font-semibold text-chart-2">
									LKR {refundableAmount.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">Outstanding from tenant</p>
								<p className="font-semibold text-chart-3">
									LKR {outstandingAmount.toLocaleString()}
								</p>
							</div>
						</div>
					</FieldGroup>
				</form>
				<DialogFooter>
					{/* ACTIONS */}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								form.reset({
									id,
									endDate: formatDateOnly(new Date()),
									expenses: [],
									notes: "",
								})
							}
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
							{endLeaseMutation.isPending
								? "Finalizing..."
								: "End Lease & Settle Deposit"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
