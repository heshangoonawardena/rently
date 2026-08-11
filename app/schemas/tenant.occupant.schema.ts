import z from "zod";
import { occupancyStatusEnum } from "@/db/schema/enums";

// ── Output schemas ──

export const tenantOccupantOutput = z.object({
	id: z.number().min(1, "Id is required"),
	tenantId: z.number().min(1, "Tenant id is required"),
	firstName: z.string().trim().min(3, "First name is required"),
	lastName: z.string().nullable(),
	nic: z.string().trim().nullable(),
	relationship: z.string().trim().min(3, "Relationship is required"),
	phone: z.string().trim().nullable(),
	status: z.enum(occupancyStatusEnum.enumValues),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const listTenantOccupantOutput = z.object({
	items: z.array(tenantOccupantOutput),
	nextCursor: z.number().positive().nullable(),
});

export type ListTenantOccupantOutput = z.infer<typeof listTenantOccupantOutput>;

// ── Input schemas ──

export const tenantOccupantSchema = z.object({
	tenantId: z.number().min(1, "Tenant id is required"),
	firstName: z.string().trim().min(3, "First name is required"),
	lastName: z.string().nullable(),
	nic: z
		.string()
		.trim()
		.transform((val) => (val.length ? val : null))
		.nullable()
		.pipe(
			z
				.string()
				.regex(/^(\d{9}[VvXx]|\d{12})$/, "Enter a valid NIC")
				.nullable(),
		),
	relationship: z
		.string()
		.trim()
		.min(3, "Relationship is required")
		.max(15, "relationship must not exceed 15 characters")
		.regex(
			/^[A-Za-z]+(?: [A-Za-z]+)*$/,
			"Relationship can only contain letters",
		),
	phone: z
		.string()
		.trim()
		.transform((val) => (val.length ? val : null))
		.nullable()
		.pipe(
			z
				.string()
				.regex(/^07\d{8}$/, "Enter a valid phone number")
				.nullable(),
		),
});

export const createTenantOccupant = tenantOccupantSchema;

export type CreateTenantOccupant = z.infer<typeof createTenantOccupant>;

export const updateTenantOccupant = tenantOccupantSchema.extend({
	id: z.number().min(1, "Id is required"),
});

export type UpdateTenantOccupant = z.infer<typeof updateTenantOccupant>;

export const deleteTenantOccupant = z.object({
	tenantId: z.number().min(1, "tenant id is required"),
	id: z.number().min(1, "Id is required"),
});

export const listTenantOccupantInput = z.object({
	tenantId: z.number(),
	status: z.enum(occupancyStatusEnum.enumValues).optional(),
	cursor: z.number().positive().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	search: z.string().optional().describe("Search by name, NIC, or phone"),
});
