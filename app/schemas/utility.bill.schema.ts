import z from "zod";
import { utilityBillStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const utilityBillOutput = z.object({
	id: z.number().min(1, "Id is required"),
	utilityId: z.number().min(1, "Utility id is required"),
	billAmount: z.coerce.number(),
	previousDueAmount: z.coerce.number().optional(),
	periodStart: z.string(),
	periodEnd: z.string(),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	status: z.enum(utilityBillStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listUtilityBillOutput = z.object({
	items: z.array(utilityBillOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const utilityBillSchema = z.object({
	utilityId: z.number().min(1, "Utility id is required"),
	billAmount: z
		.number()
		.int()
		.nonnegative()
		.transform((val) => String(val)),
	previousDueAmount: z
		.number()
		.int()
		.nonnegative()
		.transform((val) => String(val))
		.optional(),
	periodStart: z.date().transform((val) => String(val)),
	periodEnd: z.date().transform((val) => String(val)),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	status: z.enum(utilityBillStatusEnum.enumValues),
});

export const createUtilityBill = utilityBillSchema;

// export const createUtilityBill = insertUtilityBillSchema.omit({
// 	id: true,
// 	status: true,
// 	createdAt: true,
// 	updatedAt: true,
// });

export const updateUtilityBill = utilityBillSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteUtilityBill = z.object({
	utilityId: z.number(),
	id: z.number().min(1, "Id is required"),
});

export const listUtilityBillInput = z.object({
	utilityId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(utilityBillStatusEnum.enumValues).optional(),
});
