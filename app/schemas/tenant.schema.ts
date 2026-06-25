import z from "zod";
import { occupancyStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const tenantSchema = z.object({
	userId: z.string().nullish(),
	firstName: z.string().trim().min(3, "First name is required"),
	lastName: z.string().trim().nullish(),
	nickname: z.string().trim().nullish(),
	address: z
		.string()
		.trim()
		.min(5, "Address is required")
		.max(100, "Address must not exceed 100 characters")
		.nullish(),
	nic: z.string().trim().min(10, "NIC is required"),
	phoneNumber: z.string().trim().min(9, "Phone number is required"),
	status: z.enum(occupancyStatusEnum.enumValues),
});

export const tenantOutput = tenantSchema.extend({
	id: z.number().min(1, "Id is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listTenantOutput = z.object({
	items: z.array(tenantOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const createTenant = tenantSchema;

export const updateTenant = tenantSchema.extend({
	id: z.number().min(1, "Id is required"),
	occupation: z.string().trim().nullish(),
});

export const deleteTenant = z.object({
	id: z.number().min(1, "Id is required"),
});

export const tenantInput = z.object({
	id: z.number().min(1, "Id is required"),
});

export const listTenantInput = z.object({
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	search: z.string().optional().describe("Search by name, NIC, or phone"),
});
