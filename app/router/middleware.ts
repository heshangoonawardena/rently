import { implement } from "@orpc/server";
import { contract } from "../contract";
import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { member } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface AuthedUser {
	id: string;
	organizationId: string;
	role: "owner" | "manager" | "tenant";
}

export interface BaseContext {
	headers: Headers;
}

export interface AuthedContext extends BaseContext {
	user: AuthedUser;
}

const os = implement(contract).$context<BaseContext>();

// Validates the better-auth session cookie
export const authMiddleware = os
	.$context<BaseContext>()
	.middleware(async ({ context, next, errors }) => {
		const session = await auth.api.getSession({
			headers: context.headers,
		});

		if (!session?.user || !session?.session) {
			throw errors.UNAUTHORIZED();
		}

		// Resolve the user's active org membership
		const activeOrgId = session.session.activeOrganizationId;

		if (!activeOrgId) {
			throw errors.UNAUTHORIZED();
		}

		const [membership] = await db
			.select()
			.from(member)
			.where(
				and(
					eq(member.userId, session.user.id),
					eq(member.organizationId, activeOrgId),
				),
			)
			.limit(1);

		if (!membership) {
			throw errors.FORBIDDEN();
		}

		return next({
			context: {
				user: {
					id: session.user.id,
					organizationId: activeOrgId,
					role: membership.role as AuthedUser["role"],
				},
			},
		});
	});
