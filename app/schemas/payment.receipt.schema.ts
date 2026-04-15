import { insertPaymentReceiptSchema, selectPaymentReceiptSchema, updatePaymentReceiptSchema } from "@/db/schema/payment";
import z from "zod";

// ── Output schemas ──

export const PaymentReceiptOutput = selectPaymentReceiptSchema;

// ── Input schemas ──

export const CreatePaymentReceipt = insertPaymentReceiptSchema.omit({
	id: true,
	paymentId: true,
	receiptNumber: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

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

// ── Filter schemas ──

export const ListPaymentReceipt = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	items: z.array(PaymentReceiptOutput),
});

// ── Delete schemas ──

export const DeletePaymentReceipt = z.object({
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
