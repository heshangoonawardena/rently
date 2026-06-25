import z from "zod";
import { occupancyStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const tenantOccupantSchema = z.object({
	tenantId: z.number().min(1, "Tenant id is required"),
	firstName: z.string().trim().min(3, "First name is required"),
	lastName: z.string().nullable(),
	nic: z.string().trim().nullable(),
	relationship: z.string().trim().min(5, "Relationship is required"),
	phone: z.string().trim().nullable(),
});

export const tenantOccupantOutput = tenantOccupantSchema.extend({
	id: z.number().min(1, "Id is required"),
	status: z.enum(occupancyStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listTenantOccupantOutput = z.object({
	items: z.array(tenantOccupantOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const createTenantOccupant = tenantOccupantSchema;

export const updateTenantOccupant = tenantOccupantSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export const deleteTenantOccupant = z.object({
	tenantId: z.number().min(1, "tenant id is required"),
	id: z.number().min(1, "Id is required"),
});

export const listTenantOccupantInput = z.object({
	tenantId: z.number(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	search: z.string().optional().describe("Search by name, NIC, or phone"),
});
