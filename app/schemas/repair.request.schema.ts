import z from "zod";
import {
	repairPriorityEnum,
	repairStatusEnum,
	repairTypeEnum,
} from "@/db/schema/enums";
import {
	insertRepairRequestSchema,
	selectRepairRequestSchema,
	updateRepairRequestSchema,
} from "@/db/schema/repair";

// ── Output schemas ──

export const RepairRequestOutput = selectRepairRequestSchema;

export const ListRepairRequestOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(RepairRequestOutput),
});

// ── Input schemas ──

export const CreateRepairRequest = insertRepairRequestSchema.omit({
	id: true,
	userId: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateRepairRequest = updateRepairRequestSchema
	.omit({
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		unitId: z.number(),
		id: z.number().int().positive(),
	});

export const DeleteRepairRequest = z.object({
	id: z.number().int().positive(),
	unitId: z.number(),
});

export const RepairRequestInput = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const ListRepairRequestInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(repairStatusEnum.enumValues).optional(),
	priority: z.enum(repairPriorityEnum.enumValues).optional(),
	repairType: z.enum(repairTypeEnum.enumValues).optional(),
});
