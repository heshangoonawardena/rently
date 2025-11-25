"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { resetPassword } from "@/server/users";
import { resetPasswordSchema, ResetPasswordSchemaType } from "@/lib/zodSchemas";

export function ResetPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isPending, startTransition] = useTransition();

	const router = useRouter();

	const searchParams = useSearchParams();
	const token = searchParams?.get("token");

	const form = useForm<ResetPasswordSchemaType>({
		resolver: zodResolver(resetPasswordSchema),
		mode: "onTouched",
		defaultValues: {
			password: {
				newPassword: "",
				confirm: "",
			},
			token: token || "",
		},
	});

	async function onSubmit(values: ResetPasswordSchemaType) {
		startTransition(async () => {
			toast.promise(resetPassword(values), {
				loading: "We are working on updating your Password...",
				success: (data) => {
					router.replace("/login");
					return data.message;
				},
				error: (error) => {
					return error.message;
				},
			});
		});
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Reset Password</CardTitle>
					<CardDescription>
						Please enter your new password below
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form id="form-reset" onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<div className="flex flex-col gap-4">
								<Controller
									name="password.newPassword"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="newPassword">Password</FieldLabel>
											<Input
												{...field}
												id="newPassword"
												aria-invalid={fieldState.invalid}
												type="password"
												autoComplete="off"
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<FieldDescription className="col-span-2">
									Must be at least 8 characters long.
								</FieldDescription>

								<Controller
									name="password.confirm"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="confirm">
												Confirm Password
											</FieldLabel>
											<Input
												{...field}
												id="confirm"
												aria-invalid={fieldState.invalid}
												type="password"
												autoComplete="off"
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>

								<Controller
									name="token"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field className="hidden" data-invalid={fieldState.invalid}>
											<Input
												{...field}
												id="token"
												aria-invalid={fieldState.invalid}
												type="text"
												autoComplete="off"
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
				</CardContent>

				<CardFooter>
					<Field>
						<Button type="submit" form="form-reset" disabled={isPending}>
							{isPending ? (
								<Loader2 className="animate-spin size-4" />
							) : (
								"Reset Password"
							)}
						</Button>
						<FieldDescription className="text-center">
							Already have an account? <Link href="/login">Sign in</Link>
						</FieldDescription>
					</Field>
				</CardFooter>
			</Card>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our{" "}
				<Link href="#">Terms of Service</Link>
				{""}
				and <Link href="#">Privacy Policy</Link>.
			</FieldDescription>
		</div>
	);
}
