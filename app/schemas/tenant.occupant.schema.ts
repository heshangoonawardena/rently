import z from "zod";
import {
	insertTenantOccupantSchema,
	selectTenantOccupantSchema,
	updateTenantOccupantSchema,
} from "@/db/schema/tenant";

// ── Output schemas ──

export const TenantOccupantOutput = selectTenantOccupantSchema;

// ── Input schemas ──

export const CreateTenantOccupant = insertTenantOccupantSchema.omit({
	id: true,
	tenantId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateTenantOccupant = updateTenantOccupantSchema
	.omit({
		tenantId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListTenantOccupant = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	items: z.array(TenantOccupantOutput),
});

// ── Delete schemas ──

export const DeleteTenantOccupant = z.object({
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
