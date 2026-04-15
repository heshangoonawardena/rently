import z from "zod";
import { documentStatusEnum, unitStatusEnum } from "@/db/schema/enums";
import {
	insertUnitDocumentSchema,
	selectUnitDocumentSchema,
	updateUnitDocumentSchema,
} from "@/db/schema/document";

// ── Output schemas ──

export const UnitDocumentOutput = selectUnitDocumentSchema;

// ── Input schemas ──

export const CreateUnitDocument = insertUnitDocumentSchema.omit({
	id: true,
	unitId: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateUnitDocument = updateUnitDocumentSchema
	.omit({
		unitId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListUnitDocument = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: documentStatusEnum.enumValues
		? z.enum(documentStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(UnitDocumentOutput),
});

// ── Delete schemas ──

export const DeleteUnitDocument = z.object({
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
