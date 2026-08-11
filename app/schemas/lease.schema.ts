import { addMonths } from "date-fns";
import z from "zod";
import { leaseStatusEnum } from "@/db/schema/enums";
import { leaseRentOutput } from "./lease.rent.schema";
import {
	closeLeaseSchema,
	leaseSettlementOutput,
} from "./lease.settlement.schema";
import { tenantOutput } from "./tenant.schema";
import { unitOutput } from "./unit.schema";

// ── Output schemas ──

export const leaseOutput = z
	.object({
		id: z.number().min(1, "Id is required"),
		unitId: z.number().min(1, "Unit id is required"),
		tenantId: z.number().min(1, "Tenant id is required"),
		startDate: z.iso.date(),
		endDate: z.iso.date().nullable(),
		status: z.enum(leaseStatusEnum.enumValues),
		depositAmount: z.number(),
		createdAt: z.date(),
		updatedAt: z.date(),
	})
	.extend({
		unit: unitOutput,
		tenant: tenantOutput,
		currentRent: leaseRentOutput.nullable(),
		settlement: leaseSettlementOutput.nullable().optional(),
	});

export const listLeaseOutput = z.object({
	items: z.array(leaseOutput),
	nextCursor: z.number().positive().nullable(),
});

export type ListLeaseOutput = z.infer<typeof listLeaseOutput>;

const isAtLeastMonths = (start: string, end: string, months: number) => {
	const startDate = new Date(start);
	const endDate = new Date(end);

	return endDate >= addMonths(startDate, months);
};

// ── Input schemas ──

export const leaseSchema = z
	.object({
		unitId: z.number().min(1, "Unit is required"),
		tenantId: z.number().min(1, "Tenant is required"),
		startDate: z.iso.datetime("Start date is required"),
		endDate: z.iso.datetime().nullish(),
		depositAmount: z
			.number()
			.positive("Deposit amount is required")
			.multipleOf(
				0.01,
				"Deposit amount cannot have more than 2 decimal places",
			),
		rentAmount: z
			.number()
			.positive("Rent amount is required")
			.min(10_000, "Minimum rent amount is Rs. 10,000")
			.multipleOf(0.01, "Rent amount cannot have more than 2 decimal places"),
		agreedPaymentDay: z
			.number()
			.int("Agreed payment day must be a whole number")
			.min(1, "Agreed payment day must be between 1 and 28")
			.max(28, "Agreed payment day must be between 1 and 28"),
	})
	.refine(
		(data) => {
			const today = new Date();
			const maxStartDate = new Date(today);
			maxStartDate.setMonth(maxStartDate.getMonth() + 1);
			const startDate = new Date(data.startDate);
			return startDate <= maxStartDate;
		},
		{
			message: "Start date cannot be more than 1 month from today",
			path: ["startDate"],
		},
	)
	.refine(
		(data) =>
			data.depositAmount >= data.rentAmount &&
			data.depositAmount <= data.rentAmount * 12,
		{
			message: "Deposit must be between 1 and 12 times the rent amount",
			path: ["depositAmount"],
		},
	)
	.refine((data) => !data.endDate || data.endDate > data.startDate, {
		message: "End date must be a date after the start date",
		path: ["endDate"],
	})
	.refine(
		(data) => !data.endDate || isAtLeastMonths(data.startDate, data.endDate, 6),
		{
			message: "Lease period must be at least 6 months",
			path: ["endDate"],
		},
	);

export const createLease = leaseSchema;
export type CreateLease = z.infer<typeof createLease>;

export const updateLease = leaseSchema.extend({
	id: z.number().min(1, "Id is required"),
	status: z.enum(leaseStatusEnum.enumValues),
});

export type UpdateLease = z.infer<typeof updateLease>;

export const renewLease = z
	.object({
		id: z.number().min(1, "Id is required"),
		newEndDate: z.iso.datetime().nullish(),
		rentAmount: z
			.number()
			.positive("Rent amount is required")
			.min(10_000, "Minimum rent amount is Rs. 10,000")
			.multipleOf(0.01, "Rent amount cannot have more than 2 decimal places"),
		agreedPaymentDay: z
			.number()
			.int("Agreed payment day must be a whole number")
			.min(1, "Agreed payment day must be between 1 and 28")
			.max(28, "Agreed payment day must be between 1 and 28"),
		effectiveDate: z.iso.datetime(), // if rent changes on renewal
	})
	.refine(
		(data) => {
			const today = new Date();
			const maxStartDate = new Date(today);
			maxStartDate.setMonth(maxStartDate.getMonth() + 1);
			const startDate = new Date(data.effectiveDate);
			return startDate <= maxStartDate;
		},
		{
			message: "Start date cannot be more than 1 month from today",
			path: ["effectiveDate"],
		},
	)
	.refine(
		(data) =>
			!data.newEndDate ||
			(data.newEndDate > data.effectiveDate &&
				isAtLeastMonths(data.effectiveDate, data.newEndDate, 1)),
		{
			message:
				"End date must be after the start date and the extending lease period must be at least a month",
			path: ["newEndDate"],
		},
	);

export type RenewLease = z.infer<typeof renewLease>;

export const deleteLease = closeLeaseSchema;
export type DeleteLease = z.input<typeof deleteLease>;

export const leaseInput = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listLeaseInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(10),
	status: z.enum(leaseStatusEnum.enumValues).optional(),
	unitId: z.number().int().positive().optional(),
	tenantId: z.number().int().positive().optional(),
});
