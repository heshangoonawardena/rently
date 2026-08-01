import z from "zod";

// Signup form schema and Type
export const signupFormSchema = z.object({
	name: z.string().min(3, "Full name is required"),
	email: z.email("Enter a valid email address"),
	password: z
		.object({
			password: z
				.string()
				.min(8, "Password must be at least 8 characters long")
				.max(20, "Password must be less than 20 characters long")
				.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
				.regex(/[a-z]/, "Password must contain at least one lowercase letter")
				.regex(/[0-9]/, "Password must contain at least one number")
				.regex(
					/[^A-Za-z0-9]/,
					"Password must contain at least one special character",
				),
			confirm: z.string(),
		})
		.refine((data) => data.password === data.confirm, {
			message: "Password does not match",
			path: ["confirm"], // path of error
		}),
});

export type SignupFormSchemaType = z.infer<typeof signupFormSchema>;

// ---

// Signin form schema and Type
export const signInformSchema = z.object({
	email: z.email("Enter a valid email address"),
	password: z.string().min(8, "Password is required"),
});

export type SignInFormSchemaType = z.infer<typeof signInformSchema>;

// ---

// Reset password schema and Type
export const resetPasswordSchema = z.object({
	password: z
		.object({
			newPassword: z
				.string()
				.min(8, "Password must be at least 8 characters long")
				.max(20, "Password must be less than 20 characters long")
				.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
				.regex(/[a-z]/, "Password must contain at least one lowercase letter")
				.regex(/[0-9]/, "Password must contain at least one number")
				.regex(
					/[^A-Za-z0-9]/,
					"Password must contain at least one special character",
				),
			confirm: z.string(),
		})
		.refine((data) => data.newPassword === data.confirm, {
			message: "Password does not match",
			path: ["confirm"], // path of error
		}),
	token: z.string().optional(),
});

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

// ---

// Forgot password schema and Type
export const forgotPasswordSchema = z.object({
	email: z.email("Enter a valid email address"),
});

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
