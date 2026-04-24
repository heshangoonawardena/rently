import { oc } from "@orpc/contract";
import z from "zod";
import {
	CreateUnitDocument,
	DeleteUnitDocument,
	ListUnitDocumentInput,
	ListUnitDocumentOutput,
	UnitDocumentInput,
	UnitDocumentOutput,
	UpdateUnitDocument,
} from "../schemas/unit.document.schema";
import {
	CreateTenantDocument,
	DeleteTenantDocument,
	ListTenantDocumentInput,
	ListTenantDocumentOutput,
	TenantDocumentInput,
	TenantDocumentOutput,
	UpdateTenantDocument,
} from "../schemas/tenant.document.schema";
import {
	CreateLeaseDocument,
	DeleteLeaseDocument,
	LeaseDocumentInput,
	LeaseDocumentOutput,
	ListLeaseDocumentInput,
	ListLeaseDocumentOutput,
	UpdateLeaseDocument,
} from "../schemas/lease.document.schema";

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
			resourceId: z.union([z.number(), z.string()]),
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

// ── Unit Document contracts ──

export const createUnitDocumentContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/documents",
		successStatus: 201,
		summary: "Attach a document to a unit",
		description:
			"Attaches a document (title deed, insurance, council permit, etc.) to a unit. The storageKey references the file in your object storage bucket.",
		tags: ["Unit Documents"],
	})
	.input(CreateUnitDocument)
	.output(UnitDocumentOutput);

export const updateUnitDocumentContract = base
	.route({
		method: "PATCH",
		path: "/units/{unitId}/documents/{id}",
		summary: "Update a unit document",
		description:
			"Updates label, description, dates, or status of a unit document.",
		tags: ["Unit Documents"],
	})
	.input(UpdateUnitDocument)
	.output(UnitDocumentOutput);

export const supersededUnitDocumentContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/documents/{id}/supersede",
		summary: "Mark a unit document as superseded",
		description:
			"Marks a document as superseded (replaced by a newer version). Commonly used when an insurance or permit is renewed.",
		tags: ["Unit Documents"],
	})
	.input(UpdateUnitDocument)
	.output(UnitDocumentOutput);

export const getUnitDocumentContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/documents/{id}",
		summary: "Get a unit document",
		description: "Retrieves a single unit document by ID.",
		tags: ["Unit Documents"],
	})
	.input(UnitDocumentInput)
	.output(UnitDocumentOutput);

export const deleteUnitDocumentContract = base
	.route({
		method: "DELETE",
		path: "/units/{unitId}/documents/{id}",
		summary: "Delete a unit document",
		description:
			"Soft-deletes a unit document record. Does not delete the file from storage.",
		tags: ["Unit Documents"],
	})
	.input(DeleteUnitDocument)
	.output(UnitDocumentOutput);

export const listUnitDocumentContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/documents",
		summary: "List documents for a unit",
		description:
			"Returns all documents attached to a unit. Filter by status to find active, expired, or superseded documents.",
		tags: ["Unit Documents"],
	})
	.input(ListUnitDocumentInput)
	.output(ListUnitDocumentOutput);

// ── Tenant Document contracts ──

export const createTenantDocumentContract = base
	.route({
		method: "POST",
		path: "/tenants/{tenantId}/documents",
		successStatus: 201,
		summary: "Attach a document to a tenant",
		description:
			"Attaches an identity document (NIC, passport, etc.) to a tenant or one of their occupants. Pass tenantOccupantId to associate with an occupant.",
		tags: ["Tenant Documents"],
	})
	.input(CreateTenantDocument)
	.output(TenantDocumentOutput);

export const updateTenantDocumentContract = base
	.route({
		method: "PATCH",
		path: "/tenants/{tenantId}/documents/{id}",
		summary: "Update a tenant document",
		description: "Updates label, description, or status of a tenant document.",
		tags: ["Tenant Documents"],
	})
	.input(UpdateTenantDocument)
	.output(TenantDocumentOutput);

export const getTenantDocumentContract = base
	.route({
		method: "GET",
		path: "/tenants/{tenantId}/documents/{id}",
		summary: "Get a tenant document",
		description: "Retrieves a single tenant document by ID.",
		tags: ["Tenant Documents"],
	})
	.input(TenantDocumentInput)
	.output(TenantDocumentOutput);

export const deleteTenantDocumentContract = base
	.route({
		method: "DELETE",
		path: "/tenants/{tenantId}/documents/{id}",
		summary: "Delete a tenant document",
		description: "Deletes a tenant document record.",
		tags: ["Tenant Documents"],
	})
	.input(DeleteTenantDocument)
	.output(TenantDocumentOutput);

export const listTenantDocumentContract = base
	.route({
		method: "GET",
		path: "/tenants/{tenantId}/documents",
		summary: "List documents for a tenant",
		description:
			"Returns all documents (including occupant documents) under a tenant.",
		tags: ["Tenant Documents"],
	})
	.input(ListTenantDocumentInput)
	.output(ListTenantDocumentOutput);

// ── Lease Document contracts ──

export const createLeaseDocumentContract = base
	.route({
		method: "POST",
		path: "/leases/{leaseId}/documents",
		successStatus: 201,
		summary: "Attach a document to a lease",
		description:
			"Attaches a document (signed agreement, addendum, notice, etc.) to a lease. " +
			"The storageKey references the file in your object storage bucket. " +
			"A lease can have multiple documents; use status to track which is current.",
		tags: ["Lease Documents"],
	})
	.input(CreateLeaseDocument)
	.output(LeaseDocumentOutput);

export const updateLeaseDocumentContract = base
	.route({
		method: "PATCH",
		path: "/leases/{leaseId}/documents/{id}",
		summary: "Update a lease document",
		description:
			"Updates label, description, documentDate, or status of a lease document.",
		tags: ["Lease Documents"],
	})
	.input(UpdateLeaseDocument)
	.output(LeaseDocumentOutput);

export const supersededLeaseDocumentContract = base
	.route({
		method: "POST",
		path: "/leases/{leaseId}/documents/{id}/supersede",
		summary: "Mark a lease document as superseded",
		description:
			"Marks a document as superseded — typically when a new version of an agreement " +
			"or addendum is uploaded. Only active documents can be superseded.",
		tags: ["Lease Documents"],
	})
	.input(UpdateLeaseDocument)
	.output(LeaseDocumentOutput);

export const deleteLeaseDocumentContract = base
	.route({
		method: "DELETE",
		path: "/leases/{leaseId}/documents/{id}",
		summary: "Delete a lease document",
		description:
			"Soft-deletes a lease document by setting its status to 'cancelled'. " +
			"Does not delete the file from storage.",
		tags: ["Lease Documents"],
	})
	.input(DeleteLeaseDocument)
	.output(LeaseDocumentOutput);

export const getLeaseDocumentContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/documents/{id}",
		summary: "Get a lease document",
		description: "Retrieves a single lease document by ID.",
		tags: ["Lease Documents"],
	})
	.input(LeaseDocumentInput)
	.output(LeaseDocumentOutput);

export const listLeaseDocumentContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/documents",
		summary: "List documents for a lease",
		description:
			"Returns all documents attached to a lease. Filter by status to find " +
			"active, expired, superseded, or cancelled documents.",
		tags: ["Lease Documents"],
	})
	.input(ListLeaseDocumentInput)
	.output(ListLeaseDocumentOutput);
