import z from "zod";
import { documentStatusEnum } from "@/db/schema/enums";
import {
	insertUnitDocumentSchema,
	selectUnitDocumentSchema,
	updateUnitDocumentSchema,
} from "@/db/schema/document";

// ── Output schemas ──

export const UnitDocumentOutput = selectUnitDocumentSchema;

export const ListUnitDocumentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(UnitDocumentOutput),
});

// ── Input schemas ──

export const CreateUnitDocument = insertUnitDocumentSchema.omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateUnitDocument = updateUnitDocumentSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		unitId: z.number(),
		id: z.number(),
	});

export const DeleteUnitDocument = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const UnitDocumentInput = z.object({
	unitId: z.number(),
	id: z.number(),
});

export const ListUnitDocumentInput = z.object({
	unitId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(documentStatusEnum.enumValues).optional(),
});
