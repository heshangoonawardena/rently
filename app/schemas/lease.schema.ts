import z from "zod";
import { leaseStatusEnum } from "@/db/schema/enums";
import { selectUnitSchema as UnitOutput } from "@/db/schema/unit";
import { selectTenantSchema as TenantOutput } from "@/db/schema/tenant";
import { leaseRentOutput } from "./lease.rent.schema";

// ── Output schemas ──

export const leaseOutput = z.object({
	id: z.number().min(1, "Id is required"),
	unitId: z.number().min(1, "Unit id is required"),
	tenantId: z.number().min(1, "Tenant id is required"),
	startDate: z.string(),
	endDate: z.string().nullable(),
	status: z.enum(leaseStatusEnum.enumValues),
	depositAmount: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listLeaseOutput = z.object({
	items: z.array(
		leaseOutput.extend({
			unit: UnitOutput,
			tenant: TenantOutput,
			currentRent: leaseRentOutput.nullable(),
		}),
	),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const leaseSchema = z.object({
	unitId: z.number().min(1, "Unit id is required"),
	tenantId: z.number().min(1, "Tenant id is required"),
	startDate: z.date().transform((val) => String(val)),
	endDate: z
		.date()
		.transform((val) => String(val))
		.nullish(),
	depositAmount: z
		.number()
		.int()
		.nonnegative()
		.transform((val) => String(val)),
	rentAmount: z
		.number()
		.int()
		.nonnegative()
		.transform((val) => String(val)),
});

export const createLease = leaseSchema;

export const updateLease = leaseSchema.extend({
	id: z.number().min(1, "Id is required"),
	status: z.enum(leaseStatusEnum.enumValues),
});

export const renewLease = z.object({
	id: z.number().min(1, "Id is required"),
	newEndDate: z.string(),
	rentAmount: z.coerce.string().optional(), // if rent changes on renewal
	effectiveDate: z.string().optional(), // if rent changes on renewal
});

export const deleteLease = z.object({
	id: z.number().min(1, "Id is required"),
	endDate: z.string(),
});

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
