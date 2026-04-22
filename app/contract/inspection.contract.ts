import { oc } from "@orpc/contract";
import z from "zod";
import {
	CreateInspection,
	DeleteInspection,
	InspectionInput,
	InspectionOutput,
	ListInspectionInput,
	ListInspectionOutput,
	UpdateInspection,
} from "../schemas/inspection.schema";

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

export const createInspectionContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/inspections",
		successStatus: 201,
		summary: "Schedule an inspection",
		description:
			"Schedules a new inspection for a unit. Common use cases: move-in, move-out, routine, and repair-follow-up inspections.",
		tags: ["Inspections"],
	})
	.input(CreateInspection)
	.output(InspectionOutput);

export const updateInspectionContract = base
	.route({
		method: "PATCH",
		path: "/units/{unitId}/inspections/{id}",
		summary: "Update an inspection",
		description:
			"Updates inspection details. Use this to reschedule or add notes before completion.",
		tags: ["Inspections"],
	})
	.input(UpdateInspection)
	.output(InspectionOutput);

export const completeInspectionContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/inspections/{id}/complete",
		summary: "Mark an inspection as completed",
		description:
			"Transitions a scheduled inspection to 'completed'. Records the actual completion date.",
		tags: ["Inspections"],
	})
	.input(UpdateInspection)
	.output(InspectionOutput);

export const skipInspectionContract = base
	.route({
		method: "POST",
		path: "/units/{unitId}/inspections/{id}/skip",
		summary: "Mark an inspection as skipped",
		description:
			"Marks a scheduled inspection as skipped with an optional reason.",
		tags: ["Inspections"],
	})
	.input(UpdateInspection)
	.output(InspectionOutput);

export const deleteInspectionContract = base
	.route({
		method: "DELETE",
		path: "/units/{unitId}/inspections/{id}",
		summary: "Delete an inspection",
		description:
			"Soft-deletes a scheduled inspection. Completed or skipped inspections cannot be deleted.",
		tags: ["Inspections"],
	})
	.input(DeleteInspection)
	.output(InspectionOutput);

export const getInspectionContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/inspections/{id}",
		summary: "Get an inspection",
		description: "Retrieves a single inspection by ID.",
		tags: ["Inspections"],
	})
	.input(InspectionInput)
	.output(InspectionOutput);

export const listInspectionContract = base
	.route({
		method: "GET",
		path: "/units/{unitId}/inspections",
		summary: "List inspections for a unit",
		description:
			"Returns paginated inspections ordered by scheduledDate descending.",
		tags: ["Inspections"],
	})
	.input(ListInspectionInput)
	.output(ListInspectionOutput);
