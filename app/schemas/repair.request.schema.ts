import z from "zod";
import { repairStatusEnum } from "@/db/schema/enums";
import {
	insertRepairRequestSchema,
	selectRepairRequestSchema,
	updateRepairRequestSchema,
} from "@/db/schema/repair";

// ── Output schemas ──

export const RepairRequestOutput = selectRepairRequestSchema;

// ── Input schemas ──

export const CreateRepairRequest = insertRepairRequestSchema.omit({
	id: true,
	unitId: true,
	userId: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateRepairRequest = updateRepairRequestSchema
	.omit({
		unitId: true,
		userId: true,
		status: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListRepairRequest = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: repairStatusEnum.enumValues
		? z.enum(repairStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(RepairRequestOutput),
});

// ── Delete schemas ──

export const DeleteRepairRequest = z.object({
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
