import z from "zod";
import {
	insertUnitSchema,
	selectUnitSchema,
	updateUnitSchema,
} from "@/db/schema/unit";
import { unitStatusEnum } from "@/db/schema/enums";
import {
	insertRepairUpdateSchema,
	selectRepairUpdateSchema,
	updateRepairUpdateSchema,
} from "@/db/schema/repair";

// ── Output schemas ──

export const RepairUpdateOutput = selectRepairUpdateSchema;

// ── Input schemas ──

export const CreateRepairUpdate = insertRepairUpdateSchema.omit({
	id: true,
	repairRequestId: true,
	userId: true,
	oldStatus: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateRepairUpdate = updateRepairUpdateSchema
	.omit({
		repairRequestId: true,
		userId: true,
		oldStatus: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListRepairUpdate = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	items: z.array(RepairUpdateOutput),
});

// ── Delete schemas ──

export const DeleteRepairUpdate = z.object({
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
