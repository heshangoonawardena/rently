import z from "zod";
import { leaseRentStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const leaseRentOutput = z.object({
	id: z.number().min(1, "Id is required"),
	leaseId: z.number().min(1, "Lease id is required"),
	agreedPaymentDay: z.number().int().min(1).max(31),
	rentAmount: z.number(),
	effectiveDate: z.string(),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	status: z.enum(leaseRentStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listLeaseRentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(leaseRentOutput),
});

// ── Input schemas ──

export const leaseRentSchema = z.object({
	leaseId: z.number().min(1, "Lease id is required"),
	agreedPaymentDay: z.number().int().min(1).max(31),
	rentAmount: z.number().int().nonnegative(),
	// .transform((val) => String(val)),
	effectiveDate: z.date().transform((val) => String(val)),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
});

export const createLeaseRent = leaseRentSchema;

export const updateLeaseRent = leaseRentSchema.extend({
	id: z.number().min(1, "Id is required"),
	leaseId: z.number(),
	status: z.enum(leaseRentStatusEnum.enumValues),
});

export const deleteLeaseRent = z.object({
	leaseId: z.number(),
	id: z.number().min(1, "Id is required"),
});

export const listLeaseRentInput = z.object({
	leaseId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
});
