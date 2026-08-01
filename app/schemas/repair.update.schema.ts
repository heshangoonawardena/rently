import z from "zod";
import { repairStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const repairUpdateOutput = z.object({
	id: z.number().min(1, "Id is required"),
	repairRequestId: z.number().min(1, "Request id is required"),
	userId: z.string().min(1, "User id is required"),
	oldStatus: z.enum(repairStatusEnum.enumValues),
	newStatus: z.enum(repairStatusEnum.enumValues),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	// Name of the user who created the update (optional, supplied by server)
	updaterName: z.string().nullish(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listRepairUpdateOutput = z.object({
	items: z.array(repairUpdateOutput),
	nextCursor: z.number().positive().nullable(),
});

export type ListRepairUpdateOutput = z.infer<typeof listRepairUpdateOutput>;

// ── Input schemas ──

export const repairUpdateSchema = z.object({
	repairRequestId: z.number().min(1, "Request id is required"),
	newStatus: z.enum(repairStatusEnum.enumValues),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable()
		.optional(),
});

export const createRepairUpdate = repairUpdateSchema;
export type CreateRepairUpdate = z.infer<typeof createRepairUpdate>;

export const listRepairUpdateInput = z.object({
	repairRequestId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
});
