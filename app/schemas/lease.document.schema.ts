import z from "zod";
import { documentStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const leaseDocumentOutput = z.object({
	id: z.number().min(1, "Id is required"),
	leaseId: z.number().min(1, "Lease id is required"),
	documentType: z.string().min(1, "Document type is required"),
	label: z.string().min(1, "Label is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	storageKey: z.string().min(1, "Storage key is required"),
	documentDate: z.string().nullish(),
	status: z.enum(documentStatusEnum.enumValues).optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listLeaseDocumentOutput = z.object({
	nextCursor: z.number().nullable(),
	items: z.array(leaseDocumentOutput),
});

// ── Input schemas ──

export const leaseDocumentSchema = z.object({
	leaseId: z.number().min(1, "Lease id is required"),
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
	status: z.enum(documentStatusEnum.enumValues).optional(),
});

export const createLeaseDocument = leaseDocumentSchema;

export const updateLeaseDocument = leaseDocumentSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteLeaseDocument = z.object({
	leaseId: z.number(),
	id: z.number().int(),
});

export const leaseDocumentInput = z.object({
	leaseId: z.number(),
	id: z.number(),
});

export const listLeaseDocumentInput = z.object({
	leaseId: z.number(),
	cursor: z.number().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});
