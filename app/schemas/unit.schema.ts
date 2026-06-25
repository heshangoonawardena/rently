import z from "zod";
import {
	selectLeaseSchema as LeaseOutput,
	selectLeaseRentSchema as LeaseRentOutput,
} from "@/db/schema/lease";
import {
	unitStatusEnum,
	unitTypeEnum,
	utilityBillingModeEnum,
} from "@/db/schema/enums";
import { selectTenantSchema as TenantOutput } from "@/db/schema/tenant";

// ── Output schemas ──

export const unitSchema = z.object({
	name: z
		.string()
		.min(2, "Name is required")
		.max(50, "Name must not exceed 50 characters"),
	type: z.enum(unitTypeEnum.enumValues),
	address: z
		.string()
		.trim()
		.min(5, "Address is required")
		.max(100, "Address must not exceed 100 characters"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.optional()
		.nullable(),
	utilityBillingMode: z.enum(utilityBillingModeEnum.enumValues),
	status: z.enum(unitStatusEnum.enumValues),
});

export const unitOutput = unitSchema.extend({
	id: z.number().min(1, "Id is required"),
	organizationId: z.string().min(1, "Organization id is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type UnitOutput = z.infer<typeof unitOutput>;

export const listUnitOutput = z.object({
	items: z.array(
		unitOutput.extend({
			activeLease: LeaseOutput.extend({
				currentRent: LeaseRentOutput.nullable(),
				tenant: TenantOutput,
			}).nullable(),
		}),
	),
	nextCursor: z.number().positive().nullable(),
});

export type ListUnitOutput = z.infer<typeof listUnitOutput>;

// ── Input schemas ──

export const createUnit = unitSchema;

export type CreateUnit = z.infer<typeof createUnit>;

export const updateUnit = unitSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteUnit = z.object({
	id: z.number().min(1, "Id is required"),
});

export const unitInput = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listUnitInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(unitStatusEnum.enumValues).optional(),
});
