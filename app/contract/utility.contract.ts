import { oc } from "@orpc/contract";
import z from "zod";
import {
	CreateUtility,
	DeleteUtility,
	ListUtilityInput,
	ListUtilityOutput,
	UpdateUtility,
	UtilityOutput,
} from "../schemas/utility.schema";
import {
	CreateUtilityBill,
	DeleteUtilityBill,
	ListUtilityBillInput,
	ListUtilityBillOutput,
	UpdateUtilityBill,
	UtilityBillOutput,
} from "../schemas/utility.bill.schema";

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

// ── Utility account contracts ──

export const createUtilityContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/utilities",
		successStatus: 201,
		summary: "Register a utility account",
		description:
			"Links a utility account (electricity, water, etc.) to a unit. When a tenant changes and the account holder changes, mark the old one inactive and create a new record.",
		tags: ["Utilities"],
	})
	.input(CreateUtility)
	.output(UtilityOutput);

export const updateUtilityContract = base
	.route({
		method: "PATCH",
		path: "/units/{unitId}/utilities/{id}",
		summary: "Update a utility account",
		description: "Updates holder name, account number, or description.",
		tags: ["Utilities"],
	})
	.input(UpdateUtility)
	.output(UtilityOutput);

export const deactivateUtilityContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/utilities/{id}/deactivate",
		summary: "Deactivate a utility account",
		description:
			"Marks a utility account as inactive. Use when a tenant changes and the utility account changes hands.",
		tags: ["Utilities"],
	})
	.input(DeleteUtility)
	.output(UtilityOutput);

export const deleteUtilityContract = base
	.route({
		method: "DELETE",
		path: "/units/{unitId}/utilities/{id}",
		summary: "Delete a utility account",
		description:
			"Soft-deletes a utility account. Only allowed if no bills are attached.",
		tags: ["Utilities"],
	})
	.input(DeleteUtility)
	.output(UtilityOutput);

export const listUtilityContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/utilities",
		summary: "List utility accounts for a unit",
		description: "Returns all utility accounts linked to a unit.",
		tags: ["Utilities"],
	})
	.input(ListUtilityInput)
	.output(ListUtilityOutput);

// ── Utility Bill contracts ──

export const createUtilityBillContract = base
	.route({
		method: "POST",
		path: "/utilities/{utilityId}/bills",
		successStatus: 201,
		summary: "Create a utility bill",
		description: "Records a new utility bill in 'issued' status",
		tags: ["Utility Bills"],
	})
	.input(CreateUtilityBill)
	.output(UtilityBillOutput);

export const updateUtilityBillContract = base
	.route({
		method: "PATCH",
		path: "/utilities/{utilityId}/bills/{id}",
		summary: "Update a utility bill",
		description: "Updates bill details.",
		tags: ["Utility Bills"],
	})
	.input(UpdateUtilityBill)
	.output(UtilityBillOutput);

export const markUtilityBillPaidContract = base
	.route({
		method: "POST",
		path: "/utilities/{utilityId}/bills/{id}/mark-paid",
		summary: "Mark a utility bill as paid",
		description: "Transitions an issued bill to 'paid' status.",
		tags: ["Utility Bills"],
	})
	.input(UpdateUtilityBill)
	.output(UtilityBillOutput);

export const deleteUtilityBillContract = base
	.route({
		method: "DELETE",
		path: "/utilities/{utilityId}/bills/{id}",
		summary: "Delete a utility bill",
		description: "Deletes an issued utility bill.",
		tags: ["Utility Bills"],
	})
	.input(DeleteUtilityBill)
	.output(UtilityBillOutput);

export const listUtilityBillContract = base
	.route({
		method: "GET",
		path: "/utilities/{utilityId}/bills",
		summary: "List bills for a utility account",
		description:
			"Returns paginated bills. Filter by status to e.g. find all overdue bills.",
		tags: ["Utility Bills"],
	})
	.input(ListUtilityBillInput)
	.output(ListUtilityBillOutput);
