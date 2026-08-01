"use server";
import { auth } from "@/lib/auth";
import {
	forgotPasswordSchema,
	ForgotPasswordSchemaType,
	resetPasswordSchema,
	ResetPasswordSchemaType,
	signInformSchema,
	SignInFormSchemaType,
	signupFormSchema,
	SignupFormSchemaType,
} from "@/lib/zodSchemas";
import { APIError } from "better-auth";
import { headers } from "next/headers";
import { db } from "@/db/db";
import { member, user } from "@/db/schema/auth";
import { and, eq } from "drizzle-orm";

const DEFAULT_ORGANIZATION_ID = "org_1";

export const signIn = async (values: SignInFormSchemaType) => {
	// validate input using the Zod schema
	const result = signInformSchema.safeParse(values);
	if (!result.success) {
		return {
			success: false,
			message: result.error.message,
		};
	}

	// destructure validated values
	const { email, password } = values;

	// proceed with sign-in
	try {
		const [portalUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		if (portalUser) {
			const [membership] = await db
				.select({ id: member.id })
				.from(member)
				.where(
					and(
						eq(member.userId, portalUser.id),
						eq(member.organizationId, DEFAULT_ORGANIZATION_ID),
					),
				)
				.limit(1);

			if (!membership) {
				throw new Error(
					"Your account is pending admin approval. You will get access once approved.",
				);
			}
		}

		await auth.api.signInEmail({
			body: {
				email,
				password,
			},
		});

		return {
			message: "Signed in successfully",
		};
	} catch (error) {
		const e = error as APIError;
		throw new Error(e.message || "An unknown error occurred");
	}
};

export const signUp = async (values: SignupFormSchemaType) => {
	// validate input using the Zod schema
	const result = signupFormSchema.safeParse(values);
	if (!result.success) {
		return {
			success: false,
			message: result.error.message,
		};
	}

	// destructure validated values
	const {
		name,
		email,
		password: { password },
	} = values;

	// proceed with sign-up
	try {
		await auth.api.signUpEmail({
			body: {
				name,
				email,
				password,
			},
		});

		await auth.api.signOut({ headers: await headers() });

		return {
			message:
				"Account created successfully. Please wait for admin approval before signing in.",
		};
	} catch (error) {
		const e = error as APIError;
		throw new Error(e.message || "An unknown error occurred");
	}
};

// export const signUpTest = async () => {
// 	try {
// 		await auth.api.signUpEmail({
// 			body: {
// 				name: "Heshan", // required
// 				email: "heshangoonawardena@gmail.com", // required
// 				password: "password", // required
// 			},
// 		});
// 		return {
// 			success: true,
// 			message:
// 				"Account created successfully <br /> Please verify your email before signing in",
// 		};
// 	} catch (error) {
// 		const e = error as APIError;
// 		return {
// 			success: false,
// 			message: e.message || "An unknown error occurred",
// 		};
// 	}
// };

export const signOut = async () => {
	await auth.api.signOut({
		headers: await headers(),
	});
};

export const deleteUser = async (
	token?: string | undefined,
	password?: string | undefined,
) => {
	await auth.api.deleteUser({
		body: {
			token,
			password,
		},
		headers: await headers(),
	});
};

export const requestPasswordReset = async (
	values: ForgotPasswordSchemaType,
) => {
	// validate input using the Zod schema
	const result = forgotPasswordSchema.safeParse(values);
	if (!result.success) {
		return {
			success: false,
			message: result.error.message,
		};
	}

	// destructure validated values
	const { email } = values;

	// proceed with password reset request
	try {
		const result = await auth.api.requestPasswordReset({
			body: {
				email,
				redirectTo: "http://localhost:3000/reset-password",
			},
		});
		return {
			message: result.message || "Password reset link emailed successfully",
		};
	} catch (error) {
		const e = error as APIError;
		throw new Error(e.message || "An unknown error occurred");
	}
};

export const resetPassword = async (values: ResetPasswordSchemaType) => {
	// validate input using the Zod schema
	const result = resetPasswordSchema.safeParse(values);
	if (!result.success) {
		return {
			success: false,
			message: result.error.message,
		};
	}

	// destructure validated values
	const {
		password: { newPassword },
		token,
	} = values;

	// proceed with password reset
	try {
		await auth.api.resetPassword({
			body: {
				newPassword,
				token,
			},
		});
		return {
			message: "Password reset successfully",
		};
	} catch (error) {
		const e = error as APIError;
		throw new Error(e.message || "An unknown error occurred");
	}
};

// change password function has to be implemented later
