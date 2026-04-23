import z from "zod";
import { documentStatusEnum } from "@/db/schema/enums";
import {
	insertLeaseDocumentSchema,
	selectLeaseDocumentSchema,
	updateLeaseDocumentSchema,
} from "@/db/schema/document";

// ── Output schemas ──

export const LeaseDocumentOutput = selectLeaseDocumentSchema;

export const ListLeaseDocumentOutput = z.object({
	nextCursor: z.number().nullable(),
	items: z.array(LeaseDocumentOutput),
});

// ── Input schemas ──

export const CreateLeaseDocument = insertLeaseDocumentSchema.omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateLeaseDocument = updateLeaseDocumentSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		leaseId: z.number(),
		id: z.number().int(),
	});

export const DeleteLeaseDocument = z.object({
	leaseId: z.number(),
	id: z.number().int(),
});

export const LeaseDocumentInput = z.object({
	leaseId: z.number(),
	id: z.number(),
});

export const ListLeaseDocumentInput = z.object({
	leaseId: z.number(),
	cursor: z.number().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});
