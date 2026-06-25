import z from "zod";
import { repairStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const repairUpdateSchema = z.object({
	repairRequestId: z.number().min(1, "Request id is required"),
	userId: z.string().min(1, "User id is required"),
	oldStatus: z.enum(repairStatusEnum.enumValues).nullable(),
	newStatus: z.enum(repairStatusEnum.enumValues).nullable(),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
});

export const repairUpdateOutput = repairUpdateSchema.extend({
	id: z.number().min(1, "Id is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listRepairUpdateOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(repairUpdateOutput),
});

// ── Input schemas ──

export const createRepairUpdate = repairUpdateSchema;

export const listRepairUpdateInput = z.object({
	repairRequestId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
});
