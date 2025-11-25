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

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "@/server/users";
import {
	forgotPasswordSchema,
	ForgotPasswordSchemaType,
} from "@/lib/zodSchemas";

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isPending, startTransition] = useTransition();
	const form = useForm<ForgotPasswordSchemaType>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: "onTouched",
		defaultValues: {
			email: "",
		},
	});

	async function onSubmit(values: ForgotPasswordSchemaType) {
		startTransition(async () => {
			toast.promise(requestPasswordReset(values), {
				loading: "We are working on creating your email...",
				success: (data) => {
					return data;
				},
				error: (error) => {
					return error;
				},
			});
		});
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Forgot password</CardTitle>
					<CardDescription>
						Enter your email address and we'll send you a link to reset your
						password.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
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
						</FieldGroup>
					</form>
				</CardContent>

				<CardFooter>
					<Field>
						<Button type="submit" form="form-login" disabled={isPending}>
							{isPending ? (
								<Loader2 className="animate-spin size-4" />
							) : (
								"Send Reset Link"
							)}
						</Button>
						<FieldDescription className="text-center">
							Don&apos;t have an account? <Link href="/signup">Sign up</Link>
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
