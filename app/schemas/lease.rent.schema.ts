import z from "zod";
import {
	insertLeaseRentSchema,
	selectLeaseRentSchema,
	updateLeaseRentSchema,
} from "@/db/schema/lease";

// ── Output schemas ──

export const LeaseRentOutput = selectLeaseRentSchema;

export const ListLeaseRentOutput = z.object({
	items: z.array(LeaseRentOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateLeaseRent = insertLeaseRentSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateLeaseRent = updateLeaseRentSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
		leaseId: z.number(),
	});

export const DeleteLeaseRent = z.object({
	leaseId: z.number(),
	id: z.number().int().positive(),
});

export const ListLeaseRentInput = z.object({
	leaseId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
});
