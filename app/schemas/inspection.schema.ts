import z from "zod";
import { format } from "date-fns";
import { inspectionStatusEnum } from "@/db/schema/enums";

const futureScheduledDate = z.iso
	.datetime()
	.refine((value) => value.slice(0, 10) > format(new Date(), "yyyy-MM-dd"), {
		message: "Scheduled date must be after today.",
	});

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
	scheduledDate: z.iso.date(),
	completedDate: z.iso.date().nullish(),
	status: z.enum(inspectionStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listInspectionOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(inspectionOutput),
});

export type ListInspectionOutput = z.infer<typeof listInspectionOutput>;

// ── Input schemas ──

export const inspectionSchema = z.object({
	unitId: z.number().min(1, "Unit is required"),
	title: z.string().min(1, "Title is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	scheduledDate: futureScheduledDate,
});

export const createInspection = inspectionSchema;

export type CreateInspection = z.infer<typeof createInspection>;

export const updateInspection = inspectionSchema.extend({
	id: z.number().min(1, "Id is required"),
	status: z.enum(inspectionStatusEnum.enumValues),
	completedDate: z.iso.datetime().nullish(),
});

export type UpdateInspection = z.infer<typeof updateInspection>;

export const completeInspection = z.object({
	id: z.number().min(1, "Id is required"),
	completedDate: z.iso.datetime(),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
});

export type CompleteInspection = z.infer<typeof completeInspection>;

export const deleteInspection = z.object({
	id: z.number(),
});

export const inspectionInput = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const listInspectionInput = z.object({
	unitId: z.number().optional(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(inspectionStatusEnum.enumValues).optional(),
});
