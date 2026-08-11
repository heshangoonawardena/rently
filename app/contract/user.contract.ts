import { oc } from "@orpc/contract";
import z from "zod";
import {
	approveUser,
	deleteUserAccount,
	deleteUserAccountOutput,
	listAvailableTenantsOutput,
	listUsersInput,
	listUsersOutput,
	myUserNameOutput,
	revokeUserAccess,
	updateMyUserName,
	updateUserRole,
	userOutput,
} from "../schemas/user.schema";

export const base = oc.errors({
	UNAUTHORIZED: {
		status: 401,
		message: "Authentication required",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have permission to perform this action",
	},
	NOT_FOUND: {
		status: 404,
		message: "Resource not found",
		data: z.object({
			resourceType: z.string(),
			resourceId: z.string(),
		}),
	},
	CONFLICT: {
		status: 409,
		message: "Resource conflict",
		data: z.object({
			field: z.string(),
			value: z.string(),
		}),
	},
	DOMAIN_RULE_VIOLATION: {
		status: 422,
		message: "Business rule violation",
		data: z.object({
			rule: z.string(),
		}),
	},
});

export const listUsersContract = base
	.route({
		method: "GET",
		path: "/users",
		summary: "List users",
		description:
			"Lists approved organization users and pending signups awaiting admin approval.",
		tags: ["Users"],
	})
	.input(listUsersInput)
	.output(listUsersOutput);

export const getMyUserProfileContract = base
	.route({
		method: "GET",
		path: "/users/me",
		summary: "Get my display name",
		description: "Gets the current signed-in user's display name.",
		tags: ["Users"],
	})
	.input(z.object({}))
	.output(myUserNameOutput);

export const updateMyUserProfileContract = base
	.route({
		method: "PATCH",
		path: "/users/name",
		summary: "Update my display name",
		description: "Updates the current signed-in user's display name only.",
		tags: ["Users"],
	})
	.input(updateMyUserName)
	.output(myUserNameOutput);

export const updateMyUserNameContract = updateMyUserProfileContract;

export const approveUserContract = base
	.route({
		method: "PATCH",
		path: "/users/{userId}/approve",
		summary: "Approve a user",
		description:
			"Approves a signed-up user by assigning an organization role. Tenant role requires assigning a tenant record.",
		tags: ["Users"],
	})
	.input(approveUser)
	.output(userOutput);

export const listAvailableTenantsForApprovalContract = base
	.route({
		method: "GET",
		path: "/users/available-tenants",
		summary: "List available tenants",
		description:
			"Lists tenant records that are not yet linked to a portal user account.",
		tags: ["Users"],
	})
	.input(z.object({}))
	.output(listAvailableTenantsOutput);

export const updateUserRoleContract = base
	.route({
		method: "PATCH",
		path: "/users/{userId}/role",
		summary: "Update user role",
		description:
			"Updates an approved user's organization role. Tenant role requires assigning a tenant record.",
		tags: ["Users"],
	})
	.input(updateUserRole)
	.output(userOutput);

export const revokeUserAccessContract = base
	.route({
		method: "DELETE",
		path: "/users/{userId}/access",
		summary: "Revoke user access",
		description:
			"Revokes an approved user's organization access and unlinks tenant assignment if present.",
		tags: ["Users"],
	})
	.input(revokeUserAccess)
	.output(userOutput);

export const deleteUserAccountContract = base
	.route({
		method: "DELETE",
		path: "/users/{userId}",
		summary: "Delete user from the system",
		description:
			"Permanently deletes a user account and removes all system access.",
		tags: ["Users"],
	})
	.input(deleteUserAccount)
	.output(deleteUserAccountOutput);
