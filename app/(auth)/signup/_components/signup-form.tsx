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
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUp } from "@/server/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { signupFormSchema, SignupFormSchemaType } from "@/lib/zodSchemas";

export function SignupForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const form = useForm<SignupFormSchemaType>({
		resolver: zodResolver(signupFormSchema),
		mode: "onBlur",
		defaultValues: {
			name: "",
			email: "",
			password: {
				password: "",
				confirm: "",
			},
		},
	});

	async function onSubmit(values: SignupFormSchemaType) {
		startTransition(async () => {
			toast.promise(signUp(values), {
				loading: "Your account is being created...",
				success: (data) => {
					router.replace("/dashboard");
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
					<CardTitle className="text-xl">Create your account</CardTitle>
					<CardDescription>
						Enter your email below to create your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form id="form-signup" onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<Controller
								name="name"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="name">Full Name</FieldLabel>
										<Input
											{...field}
											id="name"
											aria-invalid={fieldState.invalid}
											type="text"
											placeholder="John Doe"
											autoComplete="off"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="email"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											{...field}
											id="email"
											aria-invalid={fieldState.invalid}
											type="email"
											placeholder="johndoe@gmail.com"
											autoComplete="off"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<Controller
									name="password.password"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="password">Password</FieldLabel>
											<Input
												{...field}
												id="password"
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
								<FieldDescription className="col-span-2">
									Must be at least 8 characters long.
								</FieldDescription>
							</div>
						</FieldGroup>
					</form>
				</CardContent>

				<CardFooter>
					<Field>
						<Button type="submit" form="form-signup" disabled={isPending}>
							{isPending ? (
								<Loader2 className="animate-spin size-4" />
							) : (
								"Create Account"
							)}
						</Button>
						<FieldDescription className="text-center">
							Already have an account? <Link href="/login">Sign in</Link>
						</FieldDescription>
					</Field>
				</CardFooter>
			</Card>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our <a href="#">Terms of Service</a>
				{""}
				and <a href="#">Privacy Policy</a>.
			</FieldDescription>
		</div>
	);
}
