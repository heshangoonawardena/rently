import z from "zod";
import {
	repairPriorityEnum,
	repairStatusEnum,
	repairTypeEnum,
} from "@/db/schema/enums";

// ── Output schemas ──

export const repairRequestOutput = z.object({
	id: z.number().min(1, "Id is required"),
	unitId: z.number().min(1, "Unit id is required"),
	userId: z.string().min(1, "User id is required"),
	repairType: z.enum(repairTypeEnum.enumValues),
	title: z.string().min(1, "Title is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.optional()
		.nullable(),
	priority: z.enum(repairPriorityEnum.enumValues),
	status: z.enum(repairStatusEnum.enumValues),
	requesterName: z.string().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listRepairRequestOutput = z.object({
	items: z.array(repairRequestOutput),
	nextCursor: z.number().positive().nullable(),
});

export type ListRepairRequestOutput = z.infer<typeof listRepairRequestOutput>;

// ── Input schemas ──

export const repairRequestSchema = z.object({
	unitId: z.number().min(1, "Unit is required"),
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

export const createRepairRequest = repairRequestSchema;
export type CreateRepairRequest = z.infer<typeof createRepairRequest>;

export const updateRepairRequest = repairRequestSchema.extend({
	id: z.number().int().positive(),
});
export type UpdateRepairRequest = z.infer<typeof updateRepairRequest>;

export const deleteRepairRequest = z.object({
	id: z.number().int().positive(),
});

export const repairRequestInput = z.object({
	id: z.number(),
});

export const listRepairRequestInput = z.object({
	unitId: z.number().optional(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(repairStatusEnum.enumValues).optional(),
	priority: z.enum(repairPriorityEnum.enumValues).optional(),
	repairType: z.enum(repairTypeEnum.enumValues).optional(),
});
