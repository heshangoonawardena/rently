import z from "zod";
import {
	insertUnitSchema,
	selectUnitSchema,
	updateUnitSchema,
} from "@/db/schema/unit";
import { unitStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const UnitOutput = selectUnitSchema;

// ── Input schemas ──

export const CreateUnit = insertUnitSchema.omit({
	id: true,
	organizationId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateUnit = updateUnitSchema
	.omit({
		organizationId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListUnit = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: unitStatusEnum.enumValues
		? z.enum(unitStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(UnitOutput),
});

// ── Delete schemas ──

export const DeleteUnit = z.object({
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
