import z from "zod";
import { documentStatusEnum } from "@/db/schema/enums";
import {
	insertTenantDocumentSchema,
	selectTenantDocumentSchema,
	updateTenantDocumentSchema,
} from "@/db/schema/document";

// ── Output schemas ──

export const TenantDocumentOutput = selectTenantDocumentSchema;

export const ListTenantDocumentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(TenantDocumentOutput),
});

// ── Input schemas ──

export const CreateTenantDocument = insertTenantDocumentSchema.omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateTenantDocument = updateTenantDocumentSchema
	.omit({
		tenantOccupantId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		tenantId: z.number(),
		id: z.number().int().positive(),
	});

export const DeleteTenantDocument = z.object({
	tenantId: z.number(),
	id: z.number().int().positive(),
});

export const TenantDocumentInput = z.object({
	tenantId: z.number(),
	id: z.number(),
});

export const ListTenantDocumentInput = z.object({
	tenantOccupantId: z.number().optional(),
	tenantId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});
