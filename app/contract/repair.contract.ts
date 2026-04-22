import { oc } from "@orpc/contract";
import z from "zod";
import {
	CreateRepairRequest,
	DeleteRepairRequest,
	ListRepairRequestInput,
	ListRepairRequestOutput,
	RepairRequestInput,
	RepairRequestOutput,
	UpdateRepairRequest,
} from "../schemas/repair.request.schema";
import {
	CreateRepairUpdate,
	ListRepairUpdateInput,
	ListRepairUpdateOutput,
	RepairUpdateOutput,
} from "../schemas/repair.update.schema";

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

// ── Repair Request contracts ──

export const createRepairRequestContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/repairs",
		successStatus: 201,
		summary: "Submit a repair request",
		description:
			"Opens a new repair request for a unit. Can be raised by a tenant, manager, or owner. Status defaults to 'open'.",
		tags: ["Repair Requests"],
	})
	.input(CreateRepairRequest)
	.output(RepairRequestOutput);

export const updateRepairRequestContract = base
	.route({
		method: "PATCH",
		path: "/units/{unitId}/repairs/{id}",
		summary: "Update a repair request",
		description:
			"Updates metadata (title, description, priority) on an open repair request.",
		tags: ["Repair Requests"],
	})
	.input(UpdateRepairRequest)
	.output(RepairRequestOutput);

export const deleteRepairRequestContract = base
	.route({
		method: "DELETE",
		path: "/units/{unitId}/repairs/{id}",
		summary: "Delete a repair request",
		description:
			"Deletes an open repair request. Resolved requests cannot be deleted.",
		tags: ["Repair Requests"],
	})
	.input(DeleteRepairRequest)
	.output(RepairRequestOutput);

export const getRepairRequestContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/repairs/{id}",
		summary: "Get a repair request",
		description: "Returns a single repair request with its update history.",
		tags: ["Repair Requests"],
	})
	.input(RepairRequestInput)
	.output(RepairRequestOutput);

export const listRepairRequestContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/repairs",
		summary: "List repair requests for a unit",
		description:
			"Returns a cursor-paginated list of repair requests. Filter by status or priority.",
		tags: ["Repair Requests"],
	})
	.input(ListRepairRequestInput)
	.output(ListRepairRequestOutput);

// ── Repair Update (event log) contracts ──

export const addRepairUpdateContract = base
	.route({
		method: "POST",
		path: "/repairs/{repairRequestId}/updates",
		successStatus: 201,
		summary: "Add an update to a repair request",
		description:
			"Appends an immutable update entry (status change or note) to the repair request log. oldStatus is captured server-side from the current request status.",
		tags: ["Repair Updates"],
	})
	.input(CreateRepairUpdate)
	.output(RepairUpdateOutput);

export const listRepairUpdatesContract = base
	.route({
		method: "GET",
		path: "/repairs/{repairRequestId}/updates",
		summary: "List updates for a repair request",
		description:
			"Returns the full append-only event log for a repair request, newest first.",
		tags: ["Repair Updates"],
	})
	.input(ListRepairUpdateInput)
	.output(ListRepairUpdateOutput);
