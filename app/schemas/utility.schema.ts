import z from "zod";
import { unitStatusEnum, utilityStatusEnum } from "@/db/schema/enums";
import {
	insertUtilitySchema,
	selectUtilitySchema,
	updateUtilitySchema,
} from "@/db/schema/utility";

// ── Output schemas ──

export const UtilityOutput = selectUtilitySchema;

// ── Input schemas ──

export const CreateUtility = insertUtilitySchema.omit({
	id: true,
	unitId: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateUtility = updateUtilitySchema
	.omit({
		unitId: true,
		status: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListUtility = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: utilityStatusEnum.enumValues
		? z.enum(utilityStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(UtilityOutput),
});

// ── Delete schemas ──

export const DeleteUtility = z.object({
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
