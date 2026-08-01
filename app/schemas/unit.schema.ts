import z from "zod";
import {
	leaseStatusEnum,
	unitStatusEnum,
	unitTypeEnum,
	utilityBillingModeEnum,
} from "@/db/schema/enums";
// import { leaseOutput } from "./lease.schema";
import { leaseRentOutput } from "./lease.rent.schema";
import { tenantOutput } from "./tenant.schema";

// ── Output schemas ──

export const unitOutput = z.object({
	id: z.number().min(1, "Id is required"),
	organizationId: z.string().min(1, "Organization id is required"),
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
		.nullish(),
	utilityBillingMode: z.enum(utilityBillingModeEnum.enumValues),
	status: z.enum(unitStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type UnitOutput = z.infer<typeof unitOutput>;

const leaseOutput = z.object({
	id: z.number().min(1, "Id is required"),
	unitId: z.number().min(1, "Unit id is required"),
	tenantId: z.number().min(1, "Tenant id is required"),
	startDate: z.string(),
	endDate: z.string().nullable(),
	status: z.enum(leaseStatusEnum.enumValues),
	depositAmount: z.coerce.number(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listUnitOutput = z.object({
	items: z.array(
		unitOutput.extend({
			activeLease: leaseOutput
				.extend({
					currentRent: leaseRentOutput.nullable(),
					tenant: tenantOutput,
				})
				.nullable(),
		}),
	),
	nextCursor: z.number().positive().nullable(),
});

export type ListUnitOutput = z.infer<typeof listUnitOutput>;

// ── Input schemas ──

export const unitSchema = z.object({
	name: z
		.string()
		.min(2, "Name is required")
		.max(50, "Name must not exceed 50 characters"),
	type: z.enum(unitTypeEnum.enumValues),
	address: z
		.string()
		.trim()
		.min(5, "Address must be at least 5 characters")
		.max(100, "Address must not exceed 100 characters")
		.regex(/^[\p{L}\p{N}\s.,/#'()-]+$/u, "Address contains invalid characters"),
	description: z
		.string()
		.trim()
		.max(500, "Description must not exceed 500 characters")
		.optional(),
	utilityBillingMode: z.enum(utilityBillingModeEnum.enumValues),
	status: z.enum(unitStatusEnum.enumValues),
});

export const createUnit = unitSchema;

export type UnitSchema = z.infer<typeof unitSchema>;

export const updateUnit = unitSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export type UpdateUnit = z.infer<typeof updateUnit>;

export const deleteUnit = z.object({
	id: z.number().min(1, "Id is required"),
});

export type DeleteUnit = z.infer<typeof deleteUnit>;

export const unitInput = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listUnitInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	status: z.enum(unitStatusEnum.enumValues).optional(),
	id: z.number().int().positive().optional(),
});
