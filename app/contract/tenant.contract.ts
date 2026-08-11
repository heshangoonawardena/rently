import { oc } from "@orpc/contract";
import z from "zod";
import {
	createTenantOccupant,
	deleteTenantOccupant,
	listTenantOccupantInput,
	listTenantOccupantOutput,
	tenantOccupantOutput,
	updateTenantOccupant,
} from "../schemas/tenant.occupant.schema";
import {
	createTenant,
	deleteTenant,
	listTenantInput,
	listTenantOutput,
	tenantInput,
	tenantOutput,
	updateTenant,
} from "../schemas/tenant.schema";

export const base = oc.errors({
	UNAUTHORIZED: {
		status: 401,
		message: "Authentication required",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have permission to perform this action",
	},
	NOT_FOUND: {
		status: 404,
		message: "Resource not found",
		data: z.object({
			resourceType: z.string(),
			resourceId: z.number(),
		}),
	},
	CONFLICT: {
		status: 409,
		message: "Resource conflict",
		data: z.object({
			field: z.string(),
			value: z.string(),
		}),
	},
	DOMAIN_RULE_VIOLATION: {
		status: 422,
		message: "Business rule violation",
		data: z.object({
			rule: z.string(),
		}),
	},
});

// ── Tenant contracts ──

export const createTenantContract = base
	.route({
		method: "POST",
		path: "/tenants",
		successStatus: 201,
		summary: "Create a new tenant",
		description:
			"Registers a new tenant under the active organization. NIC and phone number must be unique across the organization.",
		tags: ["Tenants"],
	})
	.input(createTenant)
	.output(tenantOutput);

export const updateTenantContract = base
	.route({
		method: "PATCH",
		path: "/tenants/{id}",
		summary: "Update an existing tenant",
		description: "Updates mutable fields on a tenant record.",
		tags: ["Tenants"],
	})
	.input(updateTenant)
	.output(tenantOutput);

export const deleteTenantContract = base
	.route({
		method: "DELETE",
		path: "/tenants/{id}",
		summary: "Delete a tenant",
		description: "Soft deletes a tenant by setting its status to inactive",
		tags: ["Tenants"],
	})
	.input(deleteTenant)
	.output(tenantOutput);

export const getTenantContract = base
	.route({
		method: "GET",
		path: "/tenants/{id}",
		summary: "Get a tenant",
		description: "Retrieves a single tenant by ID.",
		tags: ["Tenants"],
	})
	.input(tenantInput)
	.output(tenantOutput);

export const listTenantContract = base
	.route({
		method: "GET",
		path: "/tenants",
		summary: "List tenants",
		description:
			"Returns a cursor-paginated list of tenants for the active organization.",
		tags: ["Tenants"],
	})
	.input(listTenantInput)
	.output(listTenantOutput);

// ── Tenant Occupant contracts ──

export const createTenantOccupantContract = base
	.route({
		method: "POST",
		path: "/tenants/{tenantId}/occupants",
		successStatus: 201,
		summary: "Add an occupant to a tenant",
		description:
			"Registers an additional occupant (family member, employee, etc.) under a tenant.",
		tags: ["Tenant Occupants"],
	})
	.input(createTenantOccupant)
	.output(tenantOccupantOutput);

export const updateTenantOccupantContract = base
	.route({
		method: "PATCH",
		path: "/tenants/{tenantId}/occupants/{id}",
		summary: "Update a tenant occupant",
		description: "Updates an occupant record.",
		tags: ["Tenant Occupants"],
	})
	.input(updateTenantOccupant)
	.output(tenantOccupantOutput);

export const deleteTenantOccupantContract = base
	.route({
		method: "DELETE",
		path: "/tenants/{tenantId}/occupants/{id}",
		summary: "Remove a tenant occupant",
		description:
			"Soft deletes an occupant from a tenant by setting its status to inactive.",
		tags: ["Tenant Occupants"],
	})
	.input(deleteTenantOccupant)
	.output(tenantOccupantOutput);

export const listTenantOccupantContract = base
	.route({
		method: "GET",
		path: "/tenants/{tenantId}/occupants",
		summary: "List occupants for a tenant",
		description: "Returns all occupants registered under a tenant.",
		tags: ["Tenant Occupants"],
	})
	.input(listTenantOccupantInput)
	.output(listTenantOccupantOutput);
