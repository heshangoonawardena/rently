import { oc } from "@orpc/contract";
import z from "zod";
import {
	createLeaseRent,
	deleteLeaseRent,
	leaseRentOutput,
	listLeaseRentInput,
	listLeaseRentOutput,
	updateLeaseRent,
} from "../schemas/lease.rent.schema";
import {
	createLease,
	deleteLease,
	leaseInput,
	leaseOutput,
	listLeaseInput,
	listLeaseOutput,
	renewLease,
	updateLease,
} from "../schemas/lease.schema";

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

// ── Lease contracts ──

export const createLeaseContract = base
	.route({
		method: "POST",
		path: "/leases",
		successStatus: 201,
		summary: "Create a new lease",
		description:
			"Creates a new active lease, linking a tenant to a unit. A unit can only have one active lease at a time (enforced at DB level). The first rent row is created automatically from the provided initialRentAmount.",
		tags: ["Leases"],
	})
	.input(createLease)
	.output(leaseOutput);

export const updateLeaseContract = base
	.route({
		method: "PATCH",
		path: "/leases/{id}",
		summary: "Update an existing lease",
		description:
			"Updates mutable lease fields such as endDate or status. To change rent, use the rent schedule endpoint instead.",
		tags: ["Leases"],
	})
	.input(updateLease)
	.output(leaseOutput);

export const renewLeaseContract = base
	.route({
		method: "POST",
		path: "/leases/{id}/renew",
		successStatus: 200,
		summary: "Extend a lease",
		description:
			"Extends an active lease by updating the end date and optionally adding a new rent revision. Sets status to 'extended'.",
		tags: ["Leases"],
	})
	.input(renewLease)
	.output(leaseOutput);

export const deleteLeaseContract = base
	.route({
		method: "DELETE",
		path: "/leases/{id}",
		summary: "terminate a lease",
		description:
			"Sets lease status to 'terminated' and records an end date. The unit status is updated to 'available' automatically.",
		tags: ["Leases"],
	})
	.input(deleteLease)
	.output(leaseOutput);

export const getLeaseContract = base
	.route({
		method: "GET",
		path: "/leases/{id}",
		summary: "Get a lease",
		description: "Retrieves a single lease by ID.",
		tags: ["Leases"],
	})
	.input(leaseInput)
	.output(leaseOutput);

export const listLeaseContract = base
	.route({
		method: "GET",
		path: "/leases",
		summary: "List leases",
		description:
			"Returns a cursor-paginated list of leases with unit details, tenant details and current rent. Filter by status, unit, or tenant.",
		tags: ["Leases"],
	})
	.input(listLeaseInput)
	.output(listLeaseOutput);

// ── Lease Rent contracts ──

export const createLeaseRentContract = base
	.route({
		method: "POST",
		path: "/leases/{leaseId}/rents",
		successStatus: 201,
		summary: "Add a rent revision",
		description:
			"Appends a new rent amount row effective from the given date. The most recent row with effectiveDate ≤ today is the current rent.",
		tags: ["Lease Rents"],
	})
	.input(createLeaseRent)
	.output(leaseRentOutput);

export const updateLeaseRentContract = base
	.route({
		method: "PATCH",
		path: "/leases/{leaseId}/rents/{id}",
		summary: "Update a rent revision",
		description:
			"Allows correcting a future rent row before it takes effect. Past rows should not be modified.",
		tags: ["Lease Rents"],
	})
	.input(updateLeaseRent)
	.output(leaseRentOutput);

export const deleteLeaseRentContract = base
	.route({
		method: "DELETE",
		path: "/leases/{leaseId}/rents/{id}",
		summary: "Delete a rent revision",
		description:
			"Removes a future rent row. The initial rent row (seeded at lease creation) cannot be deleted.",
		tags: ["Lease Rents"],
	})
	.input(deleteLeaseRent)
	.output(leaseRentOutput);

export const listLeaseRentContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/rents",
		summary: "List rent history for a lease",
		description:
			"Returns the full rent schedule for a lease, ordered by effectiveDate ascending.",
		tags: ["Lease Rents"],
	})
	.input(listLeaseRentInput)
	.output(listLeaseRentOutput);
