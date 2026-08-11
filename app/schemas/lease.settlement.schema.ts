import z from "zod";
import { leaseSettlementExpenseCategoryEnum } from "@/db/schema/enums";

export const leaseSettlementExpenseInput = z.object({
	label: z
		.string()
		.trim()
		.min(1, "Expense label is required")
		.max(120, "Expense label must not exceed 120 characters"),
	category: z.enum(leaseSettlementExpenseCategoryEnum.enumValues),
	amount: z
		.number()
		.positive("Amount is required")
		.multipleOf(0.01, "Amount cannot have more than 2 decimal places"),
	notes: z
		.string()
		.trim()
		.max(500, "Notes must not exceed 500 characters")
		.nullish(),
});

export type LeaseSettlementExpenseInput = z.infer<typeof leaseSettlementExpenseInput>;


export const leaseSettlementExpenseOutput = leaseSettlementExpenseInput.extend({
	id: z.number().int().positive(),
	settlementId: z.number().int().positive(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const leaseSettlementOutput = z.object({
	id: z.number().int().positive(),
	leaseId: z.number().int().positive(),
	createdBy: z.string(),
	terminationDate: z.iso.date(),
	depositAtTermination: z.coerce.number(),
	totalDeductions: z.coerce.number(),
	refundAmount: z.coerce.number(),
	outstandingAmount: z.coerce.number(),
	notes: z.string().nullable(),
	expenses: z.array(leaseSettlementExpenseOutput),
	createdAt: z.date(),
	updatedAt: z.date(),
});


export const closeLeaseSchema = z
	.object({
		id: z.number().min(1, "Id is required"),
		endDate: z.iso.datetime(),
		expenses: z.array(leaseSettlementExpenseInput).default([]),
		notes: z
			.string()
			.trim()
			.max(1000, "Notes must not exceed 1000 characters")
			.nullish(),
	})
	.superRefine((data, ctx) => {
		const totalDeductions = data.expenses.reduce(
			(sum, expense) => sum + expense.amount,
			0,
		);

		if (totalDeductions >= 1_000_000.0) {
			ctx.addIssue({
				code: "custom",
				path: ["expenses"],
				message: "Total deductions are too large",
			});
		}
	});

export type CloseLease = z.infer<typeof closeLeaseSchema>;
