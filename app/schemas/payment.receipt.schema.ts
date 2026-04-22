import {
	insertPaymentReceiptSchema,
	selectPaymentReceiptSchema,
	updatePaymentReceiptSchema,
} from "@/db/schema/payment";
import z from "zod";

// ── Output schemas ──

export const PaymentReceiptOutput = selectPaymentReceiptSchema;

export const ListPaymentReceiptOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(PaymentReceiptOutput),
});

// ── Input schemas ──

export const CreatePaymentReceipt = insertPaymentReceiptSchema.omit({
	id: true,
	paymentId: true,
	receiptNumber: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdatePaymentReceipt = updatePaymentReceiptSchema
	.omit({
		paymentId: true,
		receiptNumber: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

export const DeletePaymentReceipt = z.object({
	id: z.number().int().positive(),
});

export const ReceiptInput = z.object({
	id: z.number(),
});


export const ListPaymentReceiptInput = z.object({
	leaseId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
});
