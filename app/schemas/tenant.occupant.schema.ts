import z from "zod";
import {
	insertTenantOccupantSchema,
	selectTenantOccupantSchema,
	updateTenantOccupantSchema,
} from "@/db/schema/tenant";

// ── Output schemas ──

export const TenantOccupantOutput = selectTenantOccupantSchema;

export const TenantOccupantListOutput = z.object({
	items: z.array(TenantOccupantOutput),
	nextCursor: z.number().positive().nullable(),
});

// ── Input schemas ──

export const CreateTenantOccupant = insertTenantOccupantSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	tenantId: z.number(),
});

export const UpdateTenantOccupant = updateTenantOccupantSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		tenantId: z.number(),
		id: z.number(),
	});

export const DeleteTenantOccupant = z.object({
	tenantId: z.number(),
	id: z.number(),
});

export const TenantOccupantListInput = z.object({
	tenantId: z.number(),
	cursor: z.number().positive().nullable(),
	limit: z.number().int().min(1).max(100).default(20),
	search: z.string().optional().describe("Search by name, NIC, or phone"),
});
