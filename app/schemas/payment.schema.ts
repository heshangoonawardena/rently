import z from "zod";
import {
	insertPaymentSchema,
	selectPaymentSchema,
	updatePaymentSchema,
} from "@/db/schema/payment";

// ── Output schemas ──

export const PaymentOutput = selectPaymentSchema;

// ── Input schemas ──

export const CreatePayment = insertPaymentSchema.omit({
	id: true,
	leaseId: true,
	createdAt: true,
	updatedAt: true,
});

// ── Alter schemas ──

export const UpdatePayment = updatePaymentSchema
	.omit({
		leaseId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		id: z.number().int().positive(),
	});

// ── Filter schemas ──

export const ListPayment = z.object({
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	items: z.array(PaymentOutput),
});

// ── Delete schemas ──

export const DeletePayment = z.object({
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
