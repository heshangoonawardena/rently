import z from "zod";
import { leaseStatusEnum } from "@/db/schema/enums";
import {
	insertLeaseSchema,
	selectLeaseSchema,
	updateLeaseSchema,
} from "@/db/schema/lease";

// ── Output schemas ──

export const LeaseOutput = selectLeaseSchema;

// ── Input schemas ──

export const CreateLease = insertLeaseSchema.omit({
	id: true,
	organizationId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateLease = updateLeaseSchema
	.omit({
		organizationId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListLease = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: leaseStatusEnum.enumValues
		? z.enum(leaseStatusEnum.enumValues).optional()
		: z.string().optional(),
	items: z.array(LeaseOutput),
});

// ── Delete schemas ──

export const DeleteLease = z.object({
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
