import z from "zod";
import { leaseStatusEnum } from "@/db/schema/enums";
import { leaseRentOutput } from "./lease.rent.schema";
import { unitOutput } from "./unit.schema";
import { tenantOutput } from "./tenant.schema";
import { format } from "date-fns";

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
	});

export const listLeaseOutput = z.object({
	items: z.array(leaseOutput),
	nextCursor: z.number().positive().nullable(),
});

export type ListLeaseOutput = z.infer<typeof listLeaseOutput>;

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
			.multipleOf(0.01, "Rent amount cannot have more than 2 decimal places"),
		agreedPaymentDay: z
			.number()
			.int("Agreed payment day must be a whole number")
			.min(1, "Agreed payment day must be between 1 and 30")
			.max(30, "Agreed payment day must be between 1 and 30"),
	})
	.refine((data) => !data.endDate || data.endDate > data.startDate, {
		message: "End date must be a date after the start date",
		path: ["endDate"],
	});

export const createLease = leaseSchema;
export type CreateLease = z.infer<typeof createLease>;

export const updateLease = z
	.object(leaseSchema.shape)
	.extend({
		id: z.number().min(1, "Id is required"),
		status: z.enum(leaseStatusEnum.enumValues),
	})
	.omit({
		rentAmount: true,
	});

export type UpdateLease = z.infer<typeof updateLease>;

export const renewLease = z
	.object({
		id: z.number().min(1, "Id is required"),
		newEndDate: z.iso.datetime().nullish(),
		rentAmount: z
			.number()
			.positive("Rent amount must be greater than 0")
			.multipleOf(0.01, "Rent amount cannot have more than 2 decimal places"),
		depositAmount: z
			.number()
			.positive("Rent amount must be greater than 0")
			.multipleOf(0.01, "Rent amount cannot have more than 2 decimal places"),
		agreedPaymentDay: z
			.number()
			.int("Agreed payment day must be a whole number")
			.min(1, "Agreed payment day must be between 1 and 31")
			.max(31, "Agreed payment day must be between 1 and 31"),
		effectiveDate: z.iso.datetime().optional(), // if rent changes on renewal
	})
	.refine(
		(data) => {
			if (!data.newEndDate || !data.effectiveDate) return true;
			return data.newEndDate > data.effectiveDate;
		},
		{
			message: "End date must be a date after the effective date",
			path: ["newEndDate"],
		},
	);

export type RenewLease = z.infer<typeof renewLease>;

export const deleteLease = z.object({
	id: z.number().min(1, "Id is required"),
	endDate: z.iso.datetime(),
});
export type DeleteLease = z.infer<typeof deleteLease>;

export const leaseInput = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listLeaseInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(leaseStatusEnum.enumValues).optional(),
	unitId: z.number().int().positive().optional(),
	tenantId: z.number().int().positive().optional(),
});
