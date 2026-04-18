import z from "zod";
import {
	insertUnitSchema,
	selectUnitSchema,
	updateUnitSchema,
} from "@/db/schema/unit";
import { unitStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const UnitOutput = selectUnitSchema;

export const UnitListOutput = z.object({
	items: z.array(UnitOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateUnit = insertUnitSchema.omit({
	id: true,
	organizationId: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateUnit = updateUnitSchema
	.omit({
		organizationId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number(),
	});

export const DeleteUnit = z.object({
	id: z.number(),
});

export const ListUnitInput = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(unitStatusEnum.enumValues).optional(),
});
