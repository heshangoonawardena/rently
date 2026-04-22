import z from "zod";
import {
	insertPaymentSchema,
	selectPaymentSchema,
	updatePaymentSchema,
} from "@/db/schema/payment";
import { paymentTypeEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const PaymentOutput = selectPaymentSchema;

export const ListPaymentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(PaymentOutput),
});

// ── Input schemas ──

export const CreatePayment = insertPaymentSchema.omit({
	id: true,
	balanceAfter: true,
	createdAt: true,
	updatedAt: true,
})

export const UpdatePayment = updatePaymentSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
		leaseId: z.number(),
	});

export const DeletePayment = z.object({
	id: z.number().int().positive(),
});

export const PaymentInput = z.object({
	leaseId: z.number(),
	id: z.number(),
});

export const ListPaymentInput = z.object({
	leaseId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	paymentType: z.enum(paymentTypeEnum.enumValues).optional(),
});
