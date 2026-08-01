import z from "zod";
import { occupancyStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const tenantOutput = z.object({
	id: z.number().min(1, "Id is required"),
	userId: z.string().nullish(),
	firstName: z.string().trim().min(3, "First name is required"),
	lastName: z.string().trim().nullish(),
	nickname: z.string().trim().nullish(),
	address: z
		.string()
		.trim()
		.min(5, "Address is required")
		.max(100, "Address must not exceed 100 characters"),
	nic: z.string().trim().min(10, "NIC is required"),
	phoneNumber: z.string().trim().min(10, "Phone number is required"),
	occupation: z.string().trim().nullish(),
	status: z.enum(occupancyStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listTenantOutput = z.object({
	items: z.array(tenantOutput),
	nextCursor: z.number().positive().nullable(),
});

export type ListTenantOutput = z.infer<typeof listTenantOutput>;

// ── Input schemas ──

export const tenantSchema = z.object({
	firstName: z.string().trim().min(3, "First name is required"),
	lastName: z
		.string()
		.trim()
		.transform((val) => (val.length ? val : null))
		.nullable(),
	nickname: z
		.string()
		.trim()
		.transform((val) => (val.length ? val : null))
		.nullable(),
	address: z
		.string()
		.trim()
		.min(5, "Address must be at least 5 characters")
		.max(100, "Address must not exceed 100 characters")
		.regex(/^[\p{L}\p{N}\s.,/#'()-]+$/u, "Address contains invalid characters"),
	nic: z
		.string()
		.trim()
		.min(1, "NIC is required")
		.regex(/^(\d{9}[VvXx]|\d{12})$/, "Enter a valid NIC"),
	phoneNumber: z
		.string()
		.trim()
		.regex(/^07\d{8}$/, "Enter a valid phone number"),
	occupation: z
		.string()
		.trim()
		.regex(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Occupation can only contain letters")
		.max(20, "Occupation must not exceed 20 characters")
		.transform((val) => (val.length ? val : null))
		.nullable(),
});

export const createTenant = tenantSchema;

export type TenantSchema = z.infer<typeof tenantSchema>;

export const updateTenant = tenantSchema.extend({
	id: z.number().min(1, "Id is required"),
	userId: z.string().nullish(),
	status: z.enum(occupancyStatusEnum.enumValues),
});

export type UpdateTenant = z.infer<typeof updateTenant>;

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
