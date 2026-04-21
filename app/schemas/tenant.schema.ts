import z from "zod";
import {
	insertTenantSchema,
	selectTenantSchema,
	updateTenantSchema,
} from "@/db/schema/tenant";
import { tenantStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const TenantOutput = selectTenantSchema;

export const TenantListOutput = z.object({
	items: z.array(TenantOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateTenant = insertTenantSchema.omit({
	id: true,
	organizationId: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateTenant = updateTenantSchema
	.omit({
		organizationId: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number(),
	});

export const DeleteTenant = z.object({
	id: z.number(),
});

export const ListTenantInput = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(tenantStatusEnum.enumValues).optional(),
});
