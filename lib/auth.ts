import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/db";
import { schema } from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { ForgotPasswordEmail } from "@/components/emails/reset-password";
import { EmailVerification } from "@/components/emails/verify-email";
import { ac, manager, owner, tenant } from "./auth/permissions";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			// Send reset password email (online) 👇
			await resend.emails.send({
				from: "Rently <rently@resend.dev>",
				to: user.email,
				subject: "Reset your password",
				react: ForgotPasswordEmail({
					username: user.name,
					userEmail: user.email,
					resetUrl: url,
				}),
			});

			// For development purposes (offline) 👇
			console.log("Reset password URL:", url);
		},
		// requireEmailVerification: true,
	},
	// if requireEmailVerification is true, email must verify before logging in
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			// Send verify email url (online) 👇
			await resend.emails.send({
				from: "Rently <rently@resend.dev>",
				to: user.email,
				subject: "Verify your email",
				react: EmailVerification({
					username: user.name,
					userEmail: user.email,
					verificationUrl: url,
				}),
			});

			// For development purposes (offline) 👇
			console.log("Email verification URL:", url);
		},
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
	},
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	plugins: [
		organization({
			ac,
			roles: {
				owner,
				manager,
				tenant,
			},
		}),
		nextCookies(),
	], // this must be the last in the array
});
