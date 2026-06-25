import z from "zod";
import { inspectionStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const inspectionOutput = z.object({
	id: z.number().min(1, "Id is required"),
	unitId: z.number().min(1, "Unit id is required"),
	userId: z.string().min(1, "User id is required"),
	title: z.string().min(1, "Title is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	scheduledDate: z.string(),
	completedDate: z.string().nullish(),
	status: z.enum(inspectionStatusEnum.enumValues).optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listInspectionOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(inspectionOutput),
});

// ── Input schemas ──

export const inspectionSchema = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	userId: z.string().min(1, "User id is required"),
	title: z.string().min(1, "Title is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	scheduledDate: z.date().transform((val) => String(val)),
	completedDate: z
		.date()
		.transform((val) => String(val))
		.nullish(),
	status: z.enum(inspectionStatusEnum.enumValues).optional(),
});

export const createInspection = inspectionSchema;

export const updateInspection = inspectionSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteInspection = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const inspectionInput = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const listInspectionInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(inspectionStatusEnum.enumValues).optional(),
});
