import z from "zod";
import {
	insertLeaseSchema,
	selectLeaseSchema,
	updateLeaseSchema,
} from "@/db/schema/lease";
import { leaseStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const LeaseOutput = selectLeaseSchema;

export const LeaseListOutput = z.object({
	items: z.array(LeaseOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateLease = insertLeaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateLease = updateLeaseSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number(),
	});

export const DeleteLease = z.object({
	id: z.number(),
});

export const ListLeaseInput = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(leaseStatusEnum.enumValues).optional(),
});
