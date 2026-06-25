import z from "zod";
import { paymentMethodEnum, paymentTypeEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const paymentOutput = z.object({
	id: z.number().int().positive(),
	leaseId: z.number().min(1, "Lease id is required"),
	paymentType: z.enum(paymentTypeEnum.enumValues),
	paymentMethod: z.enum(paymentMethodEnum.enumValues),
	paymentDate: z.string(),
	paymentAmount: z.string(),
	balanceAfter: z.string(),
	periodStart: z.string().nullable(),
	periodEnd: z.string().nullable(),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// export const paymentOutput = selectPaymentSchema;

export const listPaymentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(paymentOutput),
});

// ── Input schemas ──

export const paymentSchema = z.object({
	leaseId: z.number().min(1, "Lease id is required"),
	paymentType: z.enum(paymentTypeEnum.enumValues),
	paymentMethod: z.enum(paymentMethodEnum.enumValues),
	paymentDate: z.date().transform((val) => String(val)),
	paymentAmount: z
		.number()
		.int()
		.nonnegative()
		.transform((val) => String(val)),
	balanceAfter: z
		.number()
		.int()
		.nonnegative()
		.transform((val) => String(val)),
	periodStart: z.date().transform((val) => String(val)),
	periodEnd: z.date().transform((val) => String(val)),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
});

export const createPayment = paymentSchema;

export const updatePayment = paymentSchema.extend({
	id: z.number().int().positive(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const deletePayment = z.object({
	id: z.number().int().positive(),
});

export const paymentInput = z.object({
	leaseId: z.number(),
	id: z.number(),
});

export const listPaymentInput = z.object({
	leaseId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(5),
	paymentType: z.enum(paymentTypeEnum.enumValues).optional(),
});
