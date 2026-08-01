import z from "zod";

// ── Output schemas ──

export const paymentReceiptOutput = z.object({
	id: z.number().min(1, "Id is required"),
	paymentId: z.number().min(1, "Unit id is required"),
	receiptNumber: z.string().trim().min(3, "Receipt number is required"),
	issuedDate: z.string(),
	amountPaid: z.coerce.number(),
	period: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listPaymentReceiptOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(paymentReceiptOutput),
});

// ── Input schemas ──

export const receiptInput = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listPaymentReceiptInput = z.object({
	leaseId: z.number().min(1, "Lease id is required"),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
});
