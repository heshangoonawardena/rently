import z from "zod";
import {
	insertUnitSchema,
	selectUnitSchema,
	updateUnitSchema,
} from "@/db/schema/unit";
import { repairStatusEnum, unitStatusEnum } from "@/db/schema/enums";
import {
	insertRepairUpdateSchema,
	repairRequest,
	selectRepairUpdateSchema,
	updateRepairUpdateSchema,
} from "@/db/schema/repair";

// ── Output schemas ──

export const RepairUpdateOutput = selectRepairUpdateSchema;

export const ListRepairUpdateOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(RepairUpdateOutput),
});

// ── Input schemas ──

export const CreateRepairUpdate = insertRepairUpdateSchema.omit({
	id: true,
	userId: true,
	oldStatus: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateRepairUpdate = updateRepairUpdateSchema
	.omit({
		userId: true,
		oldStatus: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

export const DeleteRepairUpdate = z.object({
	unitId: z.number(),
	id: z.number().int().positive(),
});

export const ListRepairUpdateInput = z.object({
	repairRequestId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
});
