import z from "zod";
import { documentStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const tenantDocumentSchema = z.object({
	tenantId: z.number().min(1, "Tenant id is required"),
	tenantOccupantId: z.number().nullable(),
	documentType: z.string().min(1, "Document type is required"),
	label: z.string().min(1, "Label is required"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullish(),
	storageKey: z.string().min(1, "Storage key is required"),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});

export const tenantDocumentOutput = tenantDocumentSchema.extend({
	id: z.number().min(1, "Id is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listTenantDocumentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(tenantDocumentOutput),
});

// ── Input schemas ──

export const createTenantDocument = tenantDocumentSchema;

export const updateTenantDocument = tenantDocumentSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteTenantDocument = z.object({
	tenantId: z.number(),
	id: z.number().min(1, "Id is required"),
});

export const tenantDocumentInput = z.object({
	tenantId: z.number(),
	id: z.number().min(1, "Id is required"),
});

export const listTenantDocumentInput = z.object({
	tenantOccupantId: z.number().optional(),
	tenantId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});
