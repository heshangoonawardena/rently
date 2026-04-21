import z from "zod";
import {
	insertLeaseRentSchema,
	selectLeaseRentSchema,
	updateLeaseRentSchema,
} from "@/db/schema/lease";

// ── Output schemas ──

export const LeaseRentOutput = selectLeaseRentSchema;

// ── Input schemas ──

export const CreateLeaseRent = insertLeaseRentSchema.omit({
	id: true,
	leaseId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdateLeaseRent = updateLeaseRentSchema
	.omit({
		leaseId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListLeaseRent = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	items: z.array(LeaseRentOutput),
});

// ── Delete schemas ──

export const DeleteLeaseRent = z.object({
	id: z.number().int().positive(),
});
