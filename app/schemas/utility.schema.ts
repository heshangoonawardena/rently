import z from "zod";
import { utilityStatusEnum } from "@/db/schema/enums";
import {
	insertUtilitySchema,
	selectUtilitySchema,
	updateUtilitySchema,
} from "@/db/schema/utility";

// ── Output schemas ──

export const UtilityOutput = selectUtilitySchema;

export const ListUtilityOutput = z.object({
	items: z.array(UtilityOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateUtility = insertUtilitySchema.omit({
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateUtility = updateUtilitySchema
	.omit({
		status: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		unitId: z.number(),
		id: z.number().int().positive(),
	});

export const DeleteUtility = z.object({
	unitId: z.number(),
	id: z.number().int().positive(),
});

export const ListUtilityInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(utilityStatusEnum.enumValues).optional(),
});
