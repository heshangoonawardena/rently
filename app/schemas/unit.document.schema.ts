import z from "zod";
import { documentStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const unitDocumentOutput = z.object({
	id: z.number().min(1, "Id is required"),
	unitId: z.number().min(1, "Unit id is required"),
	documentType: z.string().min(1, "Document type is required"),
	label: z.string().min(1, "Label is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	storageKey: z.string().min(1, "Storage key is required"),
	documentDate: z.string().nullable(),
	expiryDate: z.string().nullable(),
	status: z.enum(documentStatusEnum.enumValues).optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listUnitDocumentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(unitDocumentOutput),
});

// ── Input schemas ──

export const unitDocumentSchema = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	documentType: z.string().min(1, "Document type is required"),
	label: z.string().min(1, "Label is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	storageKey: z.string().min(1, "Storage key is required"),
	documentDate: z
		.date()
		.transform((val) => String(val))
		.nullish(),
	expiryDate: z
		.date()
		.transform((val) => String(val))
		.nullish(),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});

export const createUnitDocument = unitDocumentSchema;

export const updateUnitDocument = unitDocumentSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteUnitDocument = z.object({
	unitId: z.number(),
	id: z.number().min(1, "Id is required"),
});

export const unitDocumentInput = z.object({
	unitId: z.number(),
	id: z.number().min(1, "Id is required"),
});

export const listUnitDocumentInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});
