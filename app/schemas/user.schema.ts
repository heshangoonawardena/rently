import z from "zod";
import { occupancyStatusEnum } from "@/db/schema/enums";

export const organizationRole = z.enum(["owner", "manager", "tenant"]);
export const approvalStatus = z.enum(["pending_approval", "approved"]);

export const userOutput = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	email: z.email(),
	emailVerified: z.boolean(),
	image: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	role: organizationRole.nullable(),
	approvalStatus: approvalStatus,
	tenantId: z.number().nullable(),
	tenantName: z.string().nullable(),
});

export const listUsersOutput = z.object({
	items: z.array(userOutput),
});

export type ListUsersOutput = z.infer<typeof listUsersOutput>;

export const listUsersInput = z.object({
	search: z.string().trim().optional(),
});

export const approveUser = z
	.object({
		userId: z.string().min(1, "User ID is required"),
		role: organizationRole,
		tenantId: z.number().int().positive().nullable().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.role === "tenant" && !value.tenantId) {
			ctx.addIssue({
				code: "custom",
				path: ["tenantId"],
				message: "Tenant assignment is required for tenant role",
			});
		}

		if (value.role !== "tenant" && value.tenantId) {
			ctx.addIssue({
				code: "custom",
				path: ["tenantId"],
				message: "Tenant assignment is only allowed for tenant role",
			});
		}
	});

export type ApproveUser = z.infer<typeof approveUser>;

export const updateUserRole = z
	.object({
		userId: z.string().min(1, "User ID is required"),
		role: organizationRole,
		tenantId: z.number().int().positive().nullable().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.role === "tenant" && !value.tenantId) {
			ctx.addIssue({
				code: "custom",
				path: ["tenantId"],
				message: "Tenant assignment is required for tenant role",
			});
		}

		if (value.role !== "tenant" && value.tenantId) {
			ctx.addIssue({
				code: "custom",
				path: ["tenantId"],
				message: "Tenant assignment is only allowed for tenant role",
			});
		}
	});

export type UpdateUserRole = z.infer<typeof updateUserRole>;

export const revokeUserAccess = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export type RevokeUserAccess = z.infer<typeof revokeUserAccess>;

export const availableTenantOutput = z.object({
	id: z.number().positive(),
	firstName: z.string().min(1),
	lastName: z.string().nullable(),
	nic: z.string().min(1),
	status: z.enum(occupancyStatusEnum.enumValues),
});

export const listAvailableTenantsOutput = z.object({
	items: z.array(availableTenantOutput),
});

export type ListAvailableTenantsOutput = z.infer<typeof listAvailableTenantsOutput>;
