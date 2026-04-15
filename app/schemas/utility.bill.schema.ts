import z from "zod";
import { utilityBillStatusEnum } from "@/db/schema/enums";
import {
	insertUtilityBillSchema,
	selectUtilityBillSchema,
	updateUtilityBillSchema,
} from "@/db/schema/utility";

// ── Output schemas ──

export const UtilityBillOutput = selectUtilityBillSchema;

// ── Input schemas ──

export const CreateUtilityBill = insertUtilityBillSchema.omit({
	id: true,
	utilityId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateUtilityBill = updateUtilityBillSchema
	.omit({
		utilityId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListUtilityBill = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: utilityBillStatusEnum.enumValues
		? z.enum(utilityBillStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(UtilityBillOutput),
});

// ── Delete schemas ──

export const DeleteUtilityBill = z.object({
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
