import z from "zod";
import { inspectionStatusEnum } from "@/db/schema/enums";
import {
	insertInspectionSchema,
	selectInspectionSchema,
	updateInspectionSchema,
} from "@/db/schema/inspection";

// ── Output schemas ──

export const InspectionOutput = selectInspectionSchema;

// ── Input schemas ──

export const CreateInspection = insertInspectionSchema.omit({
	id: true,
	unitId: true,
	userId: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateInspection = updateInspectionSchema
	.omit({
		unitId: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListInspection = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: inspectionStatusEnum.enumValues
		? z.enum(inspectionStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(InspectionOutput),
});

// ── Delete schemas ──

export const DeleteInspection = z.object({
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
