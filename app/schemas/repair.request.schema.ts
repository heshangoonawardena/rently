import z from "zod";
import {
    repairPriorityEnum,
    repairStatusEnum,
    repairTypeEnum,
} from "@/db/schema/enums";

// ── Output schemas ──

export const repairRequestSchema = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	repairType: z.enum(repairTypeEnum.enumValues),
	title: z.string().min(1, "Title is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.optional()
		.nullable(),
	priority: z.enum(repairPriorityEnum.enumValues),
});

export const repairRequestOutput = repairRequestSchema.extend({
	id: z.number().min(1, "Id is required"),
	userId: z.string().min(1, "User id is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listRepairRequestOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(repairRequestOutput),
});

// ── Input schemas ──

export const createRepairRequest = repairRequestSchema;

export const updateRepairRequest = repairRequestSchema.extend({
	unitId: z.number(),
	id: z.number().int().positive(),
});

export const deleteRepairRequest = z.object({
	id: z.number().int().positive(),
	unitId: z.number(),
});

export const repairRequestInput = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const listRepairRequestInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(repairStatusEnum.enumValues).optional(),
	priority: z.enum(repairPriorityEnum.enumValues).optional(),
	repairType: z.enum(repairTypeEnum.enumValues).optional(),
});
