import z from "zod";
import {
	insertTenantSchema,
	selectTenantSchema,
	updateTenantSchema,
} from "@/db/schema/tenant";

// ── Output schemas ──

export const TenantOutput = selectTenantSchema;

// ── Input schemas ──

export const CreateTenant = insertTenantSchema.omit({
	id: true,
	organizationId: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateTenant = updateTenantSchema
	.omit({
		organizationId: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListTenant = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	items: z.array(TenantOutput),
});

// ── Delete schemas ──

export const DeleteTenant = z.object({
	id: z.number().int().positive(),
});

// export const GetBySlugInput = z.object({
// 	slug: z.string().min(1).max(100),
// });

// export const ListTutorialsInput = z.object({
// 	cursor: z.uuid().optional(),
// 	limit: z.number().int().min(1).max(100).default(20),
// 	status: TutorialStatusEnum.exclude(["Archived"]).optional(),
// 	tag: z.string().min(1).optional(),
// 	authorId: z.string().optional(),
// });
