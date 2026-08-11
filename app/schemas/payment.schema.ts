import z from "zod";
import { paymentMethodEnum, paymentTypeEnum } from "@/db/schema/enums";
import {
	RECEIPT_NUMBER_FORMAT_MESSAGE,
	RECEIPT_NUMBER_REGEX,
} from "@/lib/receipt-number";

// ── Output schemas ──

export const paymentOutput = z.object({
	id: z.number().int().positive(),
	leaseId: z.number().min(1, "Lease id is required"),
	paymentType: z.enum(paymentTypeEnum.enumValues),
	paymentMethod: z.enum(paymentMethodEnum.enumValues),
	paymentDate: z.iso.date(),
	paymentAmount: z.number(),
	periodStart: z.iso.date().nullable(),
	periodEnd: z.iso.date().nullable(),
	receiptNumber: z.string().nullable(),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.nullable(),
	leaseSummary: z
		.object({
			leaseStatus: z.string(),
			leaseStartDate: z.iso.date(),
			unitName: z.string(),
			unitAddress: z.string(),
			tenantName: z.string(),
			tenantPhoneNumber: z.string().nullable(),
		})
		.nullable()
		.optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listPaymentOutput = z.object({
	nextCursor: z.number().positive().nullable(),
	items: z.array(paymentOutput),
});

// ── Input schemas ──

export const paymentSchema = z
	.object({
		leaseId: z
			.number("Select the lease for this payment")
			.min(1, "Lease id is required"),
		paymentType: z.enum(paymentTypeEnum.enumValues),
		paymentMethod: z.enum(paymentMethodEnum.enumValues),
		paymentDate: z.iso.datetime(),
		paymentAmount: z
			.number()
			.positive("Amount is required")
			.multipleOf(0.01, "Amount cannot have more than 2 decimal places"),
		periodStart: z.iso.date(),
		periodEnd: z.iso.date(),
		receiptNumber: z
			.string()
			.trim()
			.regex(RECEIPT_NUMBER_REGEX, RECEIPT_NUMBER_FORMAT_MESSAGE)
			.nullable()
			.optional(),
		description: z
			.string()
			.trim()
			.max(500, "Description must not exceed 500 characters")
			.nullable(),
	})
	.superRefine((data, ctx) => {
		const periodStart = new Date(data.periodStart);
		const periodEnd = new Date(data.periodEnd);

		if (periodEnd.getTime() < periodStart.getTime()) {
			ctx.addIssue({
				code: "custom",
				path: ["periodEnd"],
				message: "Period end must be on or after period start",
			});
		}

		const paymentDate = new Date(data.paymentDate);
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		if (paymentDate.getTime() > today.getTime()) {
			ctx.addIssue({
				code: "custom",
				path: ["paymentDate"],
				message: "Payment date cannot be in the future",
			});
		}

		if (data.paymentType !== "rent" && data.paymentType !== "rent_waiver") {
			return;
		}

		// if (periodStart.getTime() > paymentDate.getTime()) {
		// 	ctx.addIssue({
		// 		code: "custom",
		// 		path: ["periodStart"],
		// 		message: "For rent payments, period start cannot be after payment date",
		// 	});
		// }
	});

export const createPayment = paymentSchema;

export type CreatePayment = z.infer<typeof createPayment>;

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

export const nextRentMonthInput = z.object({
	leaseId: z.number().int().positive(),
	paymentDate: z.iso.date(),
});

export const nextRentMonthOutput = z.object({
	periodStart: z.iso.date(),
	periodEnd: z.iso.date(),
	rentAmount: z.coerce.number(),
});

export const listPaymentInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(10),
	paymentType: z.enum(paymentTypeEnum.enumValues).optional(),
	leaseId: z.number().int().positive().optional(),
});

export type ListPaymentOutput = z.infer<typeof listPaymentOutput>;
