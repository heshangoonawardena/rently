"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	createRepairRequest,
	CreateRepairRequest,
} from "@/app/schemas/repair.request.schema";
import { repairPriorityEnum, repairTypeEnum } from "@/db/schema/enums";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function AddRepairRequestModal() {
	const [open, setOpen] = React.useState(false);
	const queryClient = useQueryClient();
	const { data: sessionData } = authClient.useSession();
	const sessionUserId = sessionData?.user?.id;

	const form = useForm<CreateRepairRequest>({
		resolver: zodResolver(createRepairRequest),
		defaultValues: {
			unitId: 0,
			title: "",
			repairType: repairTypeEnum.enumValues[0],
			description: "",
			priority: repairPriorityEnum.enumValues[0],
		},
	});

	const { data } = useQuery(orpc.unit.list.queryOptions({ input: {} }));
	const units = data?.items ?? [];

	const createRepairRequestMutation = useMutation(
		orpc.repair.create.mutationOptions({
			onSuccess: () => {
				toast.success("Repair request created successfully");

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

	function onSubmit(values: CreateRepairRequest) {
		if (!sessionUserId) {
			toast.error("You need to be signed in to create a repair request.");
			return;
		}

		createRepairRequestMutation.mutate({
			...values,
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="cursor-pointer">
					<Plus className="size-4" />
					Add Repair Request
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-150">
				<DialogHeader>
					<DialogTitle>Create Repair Request</DialogTitle>

					<DialogDescription>
						Report a maintenance issue for a unit and track its progress.
					</DialogDescription>
				</DialogHeader>

				<form
					id="form-create-repair-request"
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6"
					autoComplete="off"
				>
					<FieldGroup>
						<div className="grid md:grid-cols-2 gap-4">
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
												aria-invalid={fieldState.invalid}
												className="w-full"
											>
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>

											<SelectContent>
												{units.map((unit) => {
													return (
														<SelectItem
															key={unit.id}
															value={unit.id.toString()}
														>
															{unit.name}
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
								name="repairType"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Repair Type *</FieldLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												aria-invalid={fieldState.invalid}
												className="w-full"
											>
												<SelectValue placeholder="Select repair type" />
											</SelectTrigger>

											<SelectContent>
												{repairTypeEnum.enumValues.map((value) => (
													<SelectItem key={value} value={value}>
														{value.replace("_", " ")}
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
						</div>

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
												{repairPriorityEnum.enumValues.map((value) => (
													<SelectItem key={value} value={value}>
														{value.replace("_", " ")}
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
							form="form-create-repair-request"
							disabled={createRepairRequestMutation.isPending}
						>
							{createRepairRequestMutation.isPending
								? "Creating..."
								: "Create Request"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
