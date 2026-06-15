import z from "zod";

// Signup form schema and Type
export const signupFormSchema = z.object({
	name: z.string().min(1, "Full name is required"),
	email: z.email("Please enter a valid email address"),
	password: z
		.object({
			password: z
				.string()
				.min(8, "Password must be at least 8 characters long"),
			confirm: z.string(),
		})
		.refine((data) => data.password === data.confirm, {
			message: "Confirm password must match password",
			path: ["confirm"], // path of error
		}),
});

export type SignupFormSchemaType = z.infer<typeof signupFormSchema>;

// ---

// Signin form schema and Type
export const signInformSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type SignInFormSchemaType = z.infer<typeof signInformSchema>;

// ---

// Reset password schema and Type
export const resetPasswordSchema = z.object({
	password: z
		.object({
			newPassword: z
				.string()
				.min(8, "Password must be at least 8 characters long"),
			confirm: z.string(),
		})
		.refine((data) => data.newPassword === data.confirm, {
			message: "Confirm password must match password",
			path: ["confirm"],
		}),
	token: z.string().optional(),
});

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

// ---

// Forgot password schema and Type
export const forgotPasswordSchema = z.object({
	email: z.email("Please enter a valid email address"),
});

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
