import z from "zod";
import { utilityBillStatusEnum } from "@/db/schema/enums";
import {
	insertUtilityBillSchema,
	selectUtilityBillSchema,
	updateUtilityBillSchema,
} from "@/db/schema/utility";

// ── Output schemas ──

export const UtilityBillOutput = selectUtilityBillSchema;

export const ListUtilityBillOutput = z.object({
	items: z.array(UtilityBillOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateUtilityBill = insertUtilityBillSchema.omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateUtilityBill = updateUtilityBillSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		utilityId: z.number(),
		id: z.number().int().positive(),
	});
	
	export const DeleteUtilityBill = z.object({
	utilityId: z.number(),
	id: z.number().int().positive(),
});

export const ListUtilityBillInput = z.object({
	utilityId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(utilityBillStatusEnum.enumValues).optional()
});
