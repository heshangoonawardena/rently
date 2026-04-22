import z from "zod";
import { inspectionStatusEnum } from "@/db/schema/enums";
import {
	insertInspectionSchema,
	selectInspectionSchema,
	updateInspectionSchema,
} from "@/db/schema/inspection";

// ── Output schemas ──

export const InspectionOutput = selectInspectionSchema;

export const ListInspectionOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(InspectionOutput),
});

// ── Input schemas ──

export const CreateInspection = insertInspectionSchema.omit({
	id: true,
	userId: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateInspection = updateInspectionSchema
	.omit({
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		unitId: z.number(),
		id: z.number(),
	});

export const DeleteInspection = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const InspectionInput = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const ListInspectionInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(inspectionStatusEnum.enumValues).optional(),
});
