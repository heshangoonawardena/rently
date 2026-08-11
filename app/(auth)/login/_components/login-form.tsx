"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import { type SignInFormSchemaType, signInformSchema } from "@/lib/zodSchemas";
import { signIn } from "@/server/users";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);

	const router = useRouter();
	const form = useForm<SignInFormSchemaType>({
		resolver: zodResolver(signInformSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: SignInFormSchemaType) {
		startTransition(async () => {
			toast.promise(signIn(values), {
				loading: "You are being signed in...",
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
					<CardTitle className="text-xl">Welcome back</CardTitle>
					<CardDescription>Login with email and password</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						id="form-login"
						onSubmit={form.handleSubmit(onSubmit)}
						// autoComplete="off"
					>
						<FieldGroup>
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
											placeholder="johndoe@gmail.com"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<div className="flex flex-col gap-2 items-center">
								<Controller
									name="password"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="password">Password</FieldLabel>

											<div className="relative">
												<Input
													{...field}
													id="password"
													aria-invalid={fieldState.invalid}
													type={showPassword ? "text" : "password"}
													className="pr-10"
												/>

												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-1 size-8"
													onClick={() => setShowPassword((prev) => !prev)}
												>
													{showPassword ? (
														<EyeOff className="size-4" />
													) : (
														<Eye className="size-4" />
													)}
													<span className="sr-only">
														{showPassword ? "Hide password" : "Show password"}
													</span>
												</Button>
											</div>

											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Link
									href="/forgot-password"
									className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
								>
									Forgot your password?
								</Link>
							</div>
						</FieldGroup>
					</form>
				</CardContent>

				<CardFooter>
					<Field>
						<Button type="submit" form="form-login" disabled={isPending}>
							{isPending ? (
								<Loader2 className="animate-spin size-4" />
							) : (
								"Login"
							)}
						</Button>
						<FieldDescription className="text-center">
							Don&apos;t have an account? <Link href="/signup">Sign up</Link>
						</FieldDescription>
					</Field>
				</CardFooter>
			</Card>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our{" "}
				<Link href="#">Terms of Service</Link> and{" "}
				<Link href="#">Privacy Policy</Link>.
			</FieldDescription>
		</div>
	);
}
