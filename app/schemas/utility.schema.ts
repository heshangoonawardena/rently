import z from "zod";
import { utilityStatusEnum, utilityTypeEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const utilitySchema = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	utilityType: z.enum(utilityTypeEnum.enumValues),
	holderName: z
		.string()
		.min(2, "Holder name is required")
		.max(50, "Holder name must not exceed 50 characters"),
	address: z
		.string()
		.trim()
		.min(5, "Address is required")
		.max(100, "Address must not exceed 100 characters")
		.nullable(),
	accountNumber: z
		.string()
		.min(8, "Account number is required")
		.max(20, "Account number must not exceed 20 characters"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	status: z.enum(utilityStatusEnum.enumValues),
});

export const utilityOutput = utilitySchema.extend({
	id: z.number().min(1, "Id is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listUtilityOutput = z.object({
	items: z.array(utilityOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const createUtility = utilitySchema;

export const updateUtility = utilitySchema
	.omit({
		status: true,
	})
	.extend({
		id: z.number().min(1, "Id is required"),
	});

export const deleteUtility = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	id: z.number().min(1, "Id is required"),
});

export const listUtilityInput = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(utilityStatusEnum.enumValues).optional(),
});
