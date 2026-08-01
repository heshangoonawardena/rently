"use client";

import * as React from "react";
import { CalendarIcon, CircleHelp, Edit } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FieldErrors, useForm } from "react-hook-form";

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
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import {
	ListLeaseOutput,
	updateLease,
	UpdateLease,
} from "@/app/schemas/lease.schema";
import { format } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateOnly } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
	TENANT_STATUS_META,
	UNIT_STATUS_META,
	UNIT_TYPE_META,
} from "@/config/table-facet-meta";

type EditLeaseModalProps = {
	data: ListLeaseOutput["items"][number];
	triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
	children?: React.ReactNode;
};

export function EditLeaseModal({
	data,
	triggerVariant = "ghost",
	children,
}: EditLeaseModalProps) {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const form = useForm<UpdateLease>({
		resolver: zodResolver(updateLease),
		defaultValues: {
			id: data.id,
			unitId: data.unitId,
			tenantId: data.tenantId,
			startDate: formatDateOnly(new Date(data.startDate)),
			endDate: data.endDate ? formatDateOnly(new Date(data.endDate)) : null,
			depositAmount: data.depositAmount,
			agreedPaymentDay: data.currentRent?.agreedPaymentDay,
			status: data.status,
		},
	});

	const {
		data: { items: units },
	} = useSuspenseQuery(
		orpc.unit.list.queryOptions({
			input: {},
		}),
	);
	const {
		data: { items: tenants },
	} = useSuspenseQuery(
		orpc.tenant.list.queryOptions({
			input: {},
		}),
	);

	const updateLeaseMutation = useMutation(
		orpc.lease.update.mutationOptions({
			onSuccess: () => {
				toast.success("Lease agreement updated successfully");

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

	function onSubmit(values: UpdateLease) {
		console.log(values);

		updateLeaseMutation.mutate(values);
	}

	function onError(errors: FieldErrors<UpdateLease>) {
		console.log("Form errors:", errors);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant={triggerVariant} className="w-full justify-start">
						<Edit className="mr-2 size-4" />
						Edit Lease
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Edit Lease</DialogTitle>
					<DialogDescription>Update lease agreement details.</DialogDescription>
				</DialogHeader>

				<form
					id="update-lease-form"
					onSubmit={form.handleSubmit(onSubmit, onError)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid md:grid-cols-2 gap-4">
							{/* Unit */}
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
											<SelectTrigger
												className="w-full"
												aria-invalid={fieldState.invalid}
											>
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>

											<SelectContent>
												{units.map((unit) => {
													const typeMeta =
														UNIT_TYPE_META[
															unit.type as keyof typeof UNIT_TYPE_META
														];
													const statusMeta =
														UNIT_STATUS_META[
															unit.status as keyof typeof UNIT_STATUS_META
														];
													const TypeIcon = typeMeta?.icon ?? CircleHelp;
													const StatusIcon = statusMeta?.icon ?? CircleHelp;

													return (
														<SelectItem
															key={unit.id}
															disabled={unit.id !== data.unitId}
															value={unit.id.toString()}
														>
															<div className="flex w-full items-center justify-between gap-3">
																<span className="flex items-center gap-2">
																	<TypeIcon className="size-4" />
																	<span>{unit.name}</span>
																</span>
																<span className="text-muted-foreground text-xs capitalize inline-flex items-center gap-1.5">
																	<StatusIcon className="size-3.5" />
																	{unit.status.replace("_", " ")}
																</span>
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

							{/* Tenant */}
							<Controller
								name="tenantId"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Tenant *</FieldLabel>

										<Select
											value={field.value ? field.value.toString() : undefined}
											onValueChange={(value) => field.onChange(Number(value))}
										>
											<SelectTrigger
												className="w-full"
												aria-invalid={fieldState.invalid}
											>
												<SelectValue placeholder="Select tenant" />
											</SelectTrigger>

											<SelectContent>
												{tenants.map((tenant) => {
													const statusMeta =
														TENANT_STATUS_META[
															tenant.status as keyof typeof TENANT_STATUS_META
														];
													const StatusIcon = statusMeta?.icon ?? CircleHelp;

													return (
														<SelectItem
															key={tenant.id}
															disabled={tenant.id !== data.tenantId}
															value={tenant.id.toString()}
														>
															<div className="flex w-full items-center justify-between gap-3">
																<span>
																	{tenant.nickname} - {tenant.firstName}
																</span>
																<span className="text-muted-foreground text-xs capitalize inline-flex items-center gap-1.5">
																	<StatusIcon className="size-3.5" />
																	{tenant.status.replace("_", " ")}
																</span>
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

						<div className="grid md:grid-cols-2 gap-4">
							{/* Start Date */}
							<Controller
								name="startDate"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Start Date *</FieldLabel>

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
								name="endDate"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>End Date</FieldLabel>

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

						<div className="grid md:grid-cols-2 gap-4">
							{/* Rent */}
							{/* rent amount update is not possible here */}
							{/* <Controller
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
							/> */}

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
							form="update-lease-form"
							disabled={updateLeaseMutation.isPending}
						>
							{updateLeaseMutation.isPending ? "Updating..." : "Update Lease"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
