import z, { coerce } from "zod";
import {
	insertLeaseSchema,
	selectLeaseSchema,
	updateLeaseSchema,
} from "@/db/schema/lease";
import { leaseStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const LeaseOutput = selectLeaseSchema;

export const ListLeaseOutput = z.object({
	items: z.array(LeaseOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateLease = insertLeaseSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		rentAmount: coerce.string(),
	});

export const UpdateLease = updateLeaseSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number(),
	});

export const RenewLease = z.object({
	id: z.number(),
	newEndDate: z.string(),
	rentAmount: z.coerce.string().optional(), // if rent changes on renewal
	effectiveDate: z.string().optional(), // if rent changes on renewal
});

export const DeleteLease = z.object({
	id: z.number(),
	endDate: z.string(),
});

export const LeaseInput = z.object({
	id: z.number(),
});

export const ListLeaseInput = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(leaseStatusEnum.enumValues).optional(),
	unitId: z.number().int().positive().optional(),
	tenantId: z.number().int().positive().optional(),
});
